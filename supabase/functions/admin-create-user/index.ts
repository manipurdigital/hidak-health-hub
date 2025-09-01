import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from "https://deno.land/x/djwt@v2.9/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract user id from verified JWT (verify_jwt = true)
    const token = authHeader.replace('Bearer ', '').trim()
    let userIdFromToken: string | null = null
    try {
      const [, payload] = decode(token)
      userIdFromToken = (payload as { sub?: string })?.sub ?? null
    } catch (_) {
      // ignore - handled below
    }

    if (!userIdFromToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user has admin role
    const { data: userRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userIdFromToken)

    if (roleError || !userRoles?.some(r => r.role === 'admin')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin role required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse the request body to get user creation data
    const requestBody = await req.json()
    console.log('Request body received:', requestBody)
    
    const { email, password, full_name, phone, role } = requestBody
    
    if (!email || !password) {
      console.log('Missing email or password:', { email: !!email, password: !!password })
      return new Response(
        JSON.stringify({ success: false, error: 'Email and password are required' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email format' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate role
    const validRoles = ['admin', 'doctor', 'lab', 'user']
    if (role && !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid role. Must be one of: admin, doctor, lab, user' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (checkError) {
      console.error('Error checking existing users:', checkError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check existing users', 
          details: checkError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if email already exists
    const emailExists = existingUser.users.some(user => user.email === email)
    if (emailExists) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'A user with this email already exists' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create user with auth admin
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        full_name: full_name || '',
        phone: phone || ''
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create user', 
          details: createError.message 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const newUserId = userData.user.id

    // Wait a moment for triggers to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if profile was created by trigger, if not create it manually
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', newUserId)
      .single()

    if (!existingProfile) {
      // Create profile manually if trigger didn't work
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: newUserId,
          email: email,
          full_name: full_name || '',
          phone: phone || ''
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Try to clean up the auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(newUserId)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create user profile', 
            details: profileError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Assign role (default to 'user' if not provided)
    const userRole = role || 'user'
    const { error: roleAssignError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role: userRole
      })

    if (roleAssignError) {
      console.error('Error assigning role:', roleAssignError)
      // This is critical, so fail the request
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to assign user role', 
          details: roleAssignError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'User created successfully',
        user: {
          id: newUserId,
          email: email,
          full_name: full_name || '',
          phone: phone || '',
          role: userRole
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in admin-create-user function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})