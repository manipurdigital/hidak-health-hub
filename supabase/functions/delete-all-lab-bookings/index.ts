import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      })
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Create client with user token for auth verification
    const userToken = authHeader.replace('Bearer ', '')
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Verify user authentication
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole || userRole.role !== 'admin') {
      console.error('Role check failed:', roleError)
      return new Response('Forbidden - Admin access required', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    console.log(`Admin user ${user.email} initiated deletion of all lab bookings`)

    // Get counts before deletion
    const { count: labBookingsCount, error: labBookingsCountError } = await supabase
      .from('lab_bookings')
      .select('*', { count: 'exact', head: true })

    const { count: labReportsCount, error: labReportsCountError } = await supabase
      .from('lab_reports')
      .select('*', { count: 'exact', head: true })

    if (labBookingsCountError || labReportsCountError) {
      console.error('Error counting records:', { labBookingsCountError, labReportsCountError })
      return new Response('Error counting records', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Delete lab reports first (if they reference lab bookings)
    const { error: labReportsError } = await supabase
      .from('lab_reports')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (labReportsError) {
      console.error('Error deleting lab reports:', labReportsError)
      return new Response('Error deleting lab reports: ' + labReportsError.message, { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Delete lab bookings
    const { error: labBookingsError } = await supabase
      .from('lab_bookings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (labBookingsError) {
      console.error('Error deleting lab bookings:', labBookingsError)
      return new Response('Error deleting lab bookings: ' + labBookingsError.message, { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    console.log(`Successfully deleted ${labBookingsCount} lab bookings and ${labReportsCount} lab reports`)

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully deleted ${labBookingsCount} lab bookings and ${labReportsCount} lab reports`,
      deletedCounts: {
        labBookings: labBookingsCount,
        labReports: labReportsCount
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})