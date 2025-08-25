
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupRow {
  [key: string]: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
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

    console.log('Starting database backup for admin user:', user.id);

    // Get list of tables to backup
    const { data: tableNames, error: tablesError } = await supabase.rpc('list_backup_tables');
    
    if (tablesError) {
      console.error('Error getting backup tables:', tablesError);
      return new Response(`Error getting tables: ${tablesError.message}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    if (!tableNames || tableNames.length === 0) {
      return new Response('No tables found to backup', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    console.log('Tables to backup:', tableNames);

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // First, emit metadata about tables
          const metadata = { 
            type: 'metadata', 
            timestamp: new Date().toISOString(),
            tables: tableNames 
          };
          controller.enqueue(new TextEncoder().encode(JSON.stringify(metadata) + '\n'));

          // Process each table
          for (const tableName of tableNames) {
            console.log(`Backing up table: ${tableName}`);
            
            // Get column list for this table
            const { data: columnList, error: columnsError } = await supabase.rpc('get_table_columns_for_backup', {
              p_table: tableName
            });

            if (columnsError || !columnList) {
              console.error(`Error getting columns for ${tableName}:`, columnsError);
              continue;
            }

            // Paginate through table data
            const pageSize = 1000;
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
              const { data: rows, error: dataError } = await supabase
                .from(tableName)
                .select(columnList)
                .range(offset, offset + pageSize - 1);

              if (dataError) {
                console.error(`Error fetching data from ${tableName}:`, dataError);
                break;
              }

              if (!rows || rows.length === 0) {
                hasMore = false;
                break;
              }

              // Emit each row as NDJSON
              for (const row of rows) {
                const dataLine = { 
                  type: 'data', 
                  table: tableName, 
                  row: row 
                };
                controller.enqueue(new TextEncoder().encode(JSON.stringify(dataLine) + '\n'));
              }

              offset += pageSize;
              hasMore = rows.length === pageSize;

              console.log(`Backed up ${offset} rows from ${tableName}`);
            }
          }

          console.log('Backup completed successfully');
        } catch (error) {
          console.error('Backup stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    // Return the stream with appropriate headers
    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/x-ndjson',
        'Content-Disposition': `attachment; filename="database-backup-${new Date().toISOString().slice(0, 19)}.ndjson"`,
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error) {
    console.error('Backup error:', error);
    return new Response(`Internal server error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
