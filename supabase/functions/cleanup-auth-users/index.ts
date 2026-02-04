import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // List all auth users
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    console.log(`Found ${authUsers.users.length} auth users to delete`);

    const deletedUsers: string[] = [];
    const errors: string[] = [];

    // Delete each user
    for (const user of authUsers.users) {
      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`Error deleting user ${user.email}:`, deleteError);
          errors.push(`${user.email}: ${deleteError.message}`);
        } else {
          console.log(`Deleted user: ${user.email}`);
          deletedUsers.push(user.email || user.id);
        }
      } catch (e) {
        console.error(`Exception deleting user ${user.email}:`, e);
        errors.push(`${user.email}: ${e.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${deletedUsers.length} auth users`,
        deletedUsers,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
