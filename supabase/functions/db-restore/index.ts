
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RestoreMetadata {
  type: 'metadata';
  timestamp: string;
  tables: string[];
}

interface RestoreDataLine {
  type: 'data';
  table: string;
  row: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the current session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Missing authorization header', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Verify admin access
    const { data: hasAccess, error: accessError } = await supabase.rpc('has_admin_access', {
      _user_id: user.id
    });

    if (accessError || !hasAccess) {
      return new Response('Forbidden - Admin access required', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') as string || 'append';

    if (!file) {
      return new Response('No file provided', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log(`Starting database restore for admin user: ${user.id}, mode: ${mode}`);

    const fileContent = await file.text();
    const lines = fileContent.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return new Response('Empty backup file', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Parse metadata from first line
    let metadata: RestoreMetadata | null = null;
    try {
      const firstLine = JSON.parse(lines[0]);
      if (firstLine.type === 'metadata') {
        metadata = firstLine;
      }
    } catch (error) {
      console.error('Error parsing metadata:', error);
    }

    // If mode is 'replace', truncate tables first
    if (mode === 'replace' && metadata && metadata.tables) {
      console.log('Truncating tables for replace mode:', metadata.tables);
      
      const { error: truncateError } = await supabase.rpc('restore_truncate_tables', {
        p_tables: metadata.tables
      });

      if (truncateError) {
        console.error('Error truncating tables:', truncateError);
        return new Response(`Error truncating tables: ${truncateError.message}`, { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    // Process data lines in batches
    const batchSize = 500;
    const tableRows: Record<string, any[]> = {};
    const tableCounts: Record<string, number> = {};
    let totalRows = 0;
    let lineIndex = metadata ? 1 : 0; // Skip metadata line

    // Collect rows by table
    for (let i = lineIndex; i < lines.length; i++) {
      try {
        const dataLine: RestoreDataLine = JSON.parse(lines[i]);
        
        if (dataLine.type === 'data' && dataLine.table && dataLine.row) {
          if (!tableRows[dataLine.table]) {
            tableRows[dataLine.table] = [];
            tableCounts[dataLine.table] = 0;
          }
          
          tableRows[dataLine.table].push(dataLine.row);
          
          // Process batch when it reaches the limit
          if (tableRows[dataLine.table].length >= batchSize) {
            const { data: insertedCount, error: insertError } = await supabase.rpc('restore_insert_rows', {
              p_table: dataLine.table,
              p_rows: tableRows[dataLine.table]
            });

            if (insertError) {
              console.error(`Error inserting batch into ${dataLine.table}:`, insertError);
              return new Response(`Error inserting data into ${dataLine.table}: ${insertError.message}`, { 
                status: 500, 
                headers: corsHeaders 
              });
            }

            tableCounts[dataLine.table] += insertedCount || 0;
            totalRows += insertedCount || 0;
            tableRows[dataLine.table] = []; // Reset batch

            console.log(`Inserted batch into ${dataLine.table}, total so far: ${tableCounts[dataLine.table]}`);
          }
        }
      } catch (error) {
        console.error(`Error processing line ${i}:`, error);
        continue;
      }
    }

    // Process remaining rows in each table
    for (const [tableName, rows] of Object.entries(tableRows)) {
      if (rows.length > 0) {
        const { data: insertedCount, error: insertError } = await supabase.rpc('restore_insert_rows', {
          p_table: tableName,
          p_rows: rows
        });

        if (insertError) {
          console.error(`Error inserting final batch into ${tableName}:`, insertError);
          return new Response(`Error inserting final data into ${tableName}: ${insertError.message}`, { 
            status: 500, 
            headers: corsHeaders 
          });
        }

        tableCounts[tableName] += insertedCount || 0;
        totalRows += insertedCount || 0;

        console.log(`Inserted final batch into ${tableName}, total: ${tableCounts[tableName]}`);
      }
    }

    const result = {
      success: true,
      mode,
      totalRows,
      tableCounts,
      processedLines: lines.length,
      timestamp: new Date().toISOString()
    };

    console.log('Restore completed successfully:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Restore error:', error);
    return new Response(`Internal server error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
