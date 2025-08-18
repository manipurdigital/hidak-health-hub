import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PolygonPayload {
  id?: string;
  center_type: 'lab' | 'delivery';
  center_id: string;
  name: string;
  color?: string;
  active?: boolean;
  priority?: number;
  capacity_per_day?: number;
  working_hours?: Record<string, any>;
  shape_type: 'polygon';
  coordinates: Array<[number, number]>; // [lng, lat] pairs
}

interface CirclePayload {
  id?: string;
  center_type: 'lab' | 'delivery';
  center_id: string;
  name: string;
  color?: string;
  active?: boolean;
  priority?: number;
  capacity_per_day?: number;
  working_hours?: Record<string, any>;
  shape_type: 'circle';
  center: [number, number]; // [lng, lat]
  radius_meters: number;
}

type ServiceAreaPayload = PolygonPayload | CirclePayload;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      supabaseClient.auth.setSession({
        access_token: authHeader.replace('Bearer ', ''),
        refresh_token: '',
      });
    }

    const payload: ServiceAreaPayload = await req.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.center_type || !payload.center_id || !payload.name || !payload.shape_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: center_type, center_id, name, shape_type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let geographySQL: string;

    if (payload.shape_type === 'polygon') {
      const polygonPayload = payload as PolygonPayload;
      
      if (!polygonPayload.coordinates || polygonPayload.coordinates.length < 3) {
        return new Response(
          JSON.stringify({ error: 'Polygon must have at least 3 coordinates' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Ensure polygon is closed (first and last points are the same)
      const coords = [...polygonPayload.coordinates];
      const first = coords[0];
      const last = coords[coords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coords.push(first);
      }

      // Convert to WKT format: POLYGON((lng lat, lng lat, ...))
      const wktCoords = coords.map(([lng, lat]) => `${lng} ${lat}`).join(', ');
      const wkt = `POLYGON((${wktCoords}))`;
      geographySQL = `ST_GeogFromText('${wkt}')`;
      
      console.log('Generated polygon WKT:', wkt);

    } else if (payload.shape_type === 'circle') {
      const circlePayload = payload as CirclePayload;
      
      if (!circlePayload.center || !circlePayload.radius_meters) {
        return new Response(
          JSON.stringify({ error: 'Circle must have center coordinates and radius_meters' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const [lng, lat] = circlePayload.center;
      if (circlePayload.radius_meters <= 0) {
        return new Response(
          JSON.stringify({ error: 'Radius must be greater than 0' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Create buffered point: ST_Buffer(ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
      geographySQL = `ST_Buffer(ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${circlePayload.radius_meters})`;
      
      console.log('Generated circle buffer SQL:', geographySQL);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid shape_type. Must be "polygon" or "circle"' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare the data for upsert
    const serviceAreaData = {
      center_type: payload.center_type,
      center_id: payload.center_id,
      name: payload.name,
      color: payload.color || '#22c55e',
      active: payload.active !== undefined ? payload.active : true,
      priority: payload.priority || 0,
      capacity_per_day: payload.capacity_per_day || 0,
      working_hours: payload.working_hours || {},
    };

    let result;

    if (payload.id) {
      // Update existing service area
      console.log('Updating service area with ID:', payload.id);
      
      const { data, error } = await supabaseClient
        .rpc('update_service_area_geom', {
          area_id: payload.id,
          new_geom: geographySQL,
          area_data: serviceAreaData
        });

      if (error) {
        console.error('Error updating service area:', error);
        return new Response(
          JSON.stringify({ error: `Failed to update service area: ${error.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      result = { id: payload.id, ...serviceAreaData };
    } else {
      // Create new service area
      console.log('Creating new service area');
      
      const { data, error } = await supabaseClient
        .rpc('create_service_area_with_geom', {
          area_data: serviceAreaData,
          geom_sql: geographySQL
        });

      if (error) {
        console.error('Error creating service area:', error);
        return new Response(
          JSON.stringify({ error: `Failed to create service area: ${error.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      result = data;
    }

    console.log('Service area operation successful:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        message: payload.id ? 'Service area updated successfully' : 'Service area created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in upsert-service-area function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});