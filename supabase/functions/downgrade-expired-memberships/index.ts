import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

console.log("Downgrade Expired Memberships function initializing.");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables.');
    }

    // Create Supabase Admin Client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    });

    const nowUTC = new Date().toISOString();
    console.log(`Current UTC time: ${nowUTC}`);

    // 1. Find expired premium users
    const { data: expiredUsers, error: findError } = await supabaseAdmin
      .from('user_quotas')
      .select('user_id')
      .eq('membership_type', 'premium')
      .lte('premium_expires_at', nowUTC); // Less than or equal to now

    if (findError) {
      console.error('Error finding expired users:', findError);
      throw findError;
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log('No expired premium users found.');
      return new Response(
        JSON.stringify({ message: 'No expired users found.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const userIdsToDowngrade = expiredUsers.map((user) => user.user_id);
    console.log(`Found ${userIdsToDowngrade.length} users to downgrade:`, userIdsToDowngrade);

    // 2. Downgrade the found users
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('user_quotas')
      .update({
        membership_type: 'free',
        remaining_queries: 10,
        premium_expires_at: null,
        updated_at: nowUTC
      })
      .in('user_id', userIdsToDowngrade) // Target only the expired users
      .select(); // Get the updated records

    if (updateError) {
      console.error('Error downgrading users:', updateError);
      throw updateError;
    }

    console.log(`Successfully downgraded ${updateData.length} users.`);

    return new Response(
      JSON.stringify({
        message: `Successfully processed expirations. Downgraded ${updateData.length} users.`,
        downgraded_users: updateData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in Downgrade Function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 