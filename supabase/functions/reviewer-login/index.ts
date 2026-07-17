// Lets App Store / Play reviewers sign in without a real inbox: the app is
// passwordless (email OTP), which App Review's "username + password" field
// can't represent. This mints a real session for one hardcoded reviewer
// account when given a fixed code, instead of the random per-request OTP
// every other account gets. Only that single allow-listed email works here —
// every other email is rejected outright, so this can't be used to skip OTP
// verification for real users.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const REVIEWER_EMAIL = 'review@getrunoff.com';
const REVIEWER_CODE = '123456';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (normalizedEmail !== REVIEWER_EMAIL || code !== REVIEWER_CODE) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: REVIEWER_EMAIL,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      throw linkError ?? new Error('Could not generate reviewer session');
    }

    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: verifyData, error: verifyError } = await anonClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (verifyError || !verifyData.session) {
      throw verifyError ?? new Error('Could not verify reviewer session');
    }

    return new Response(
      JSON.stringify({
        access_token: verifyData.session.access_token,
        refresh_token: verifyData.session.refresh_token,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
