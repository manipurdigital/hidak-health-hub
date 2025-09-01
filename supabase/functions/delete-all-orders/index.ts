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

    console.log(`Admin user ${user.email} initiated deletion of all orders`)

    // First, get count of orders to be deleted
    const { count: orderCount, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting orders:', countError)
      return new Response('Error counting orders', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Delete related data first (order_items and delivery_assignments)
    // Delete order_items first
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // This condition will match all records

    if (orderItemsError) {
      console.error('Error deleting order_items:', orderItemsError)
      return new Response('Error deleting order items: ' + orderItemsError.message, { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Delete delivery_assignments
    const { error: deliveryAssignmentsError } = await supabase
      .from('delivery_assignments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // This condition will match all records

    if (deliveryAssignmentsError) {
      console.error('Error deleting delivery_assignments:', deliveryAssignmentsError)
      return new Response('Error deleting delivery assignments: ' + deliveryAssignmentsError.message, { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Finally, delete all orders
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // This condition will match all records

    if (deleteError) {
      console.error('Error deleting orders:', deleteError)
      return new Response('Error deleting orders: ' + deleteError.message, { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    console.log(`Successfully deleted ${orderCount} orders and related data`)

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully deleted ${orderCount} orders and related data`,
      deletedCount: orderCount
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