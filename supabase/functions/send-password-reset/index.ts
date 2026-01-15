import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// TODO: Amazon SES integration will be added here
// import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    console.log(`Processing password reset request for: ${email}`);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // First, check if user exists in public.users table
    const { data: publicUsers, error: publicUsersError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, establishment_id, role, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(2);

    if (publicUsersError || !publicUsers || publicUsers.length === 0) {
      console.error('User not found in public.users:', publicUsersError);
      return new Response(
        JSON.stringify({ error: "Aucun utilisateur trouvé avec cet email" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (publicUsers.length > 1) {
      console.warn(`Multiple public.users rows found for email ${email}. Using the most recent one.`);
    }

    const publicUser = publicUsers[0];

    console.log(`Found user in public.users: ${publicUser.id}`);

    // Check if user exists in auth.users
    let authUser: any = null;
    let page = 1;
    const perPage = 1000;

    while (!authUser) {
      const { data: pageData, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (authListError) {
        console.error('Error listing auth users:', authListError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la vérification du compte" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const users = pageData?.users ?? [];
      authUser = users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase()) ?? null;

      if (!authUser && users.length < perPage) break;

      page += 1;
      if (page > 20) break;
    }

    let resetLink: string;

    if (!authUser) {
      console.warn(`No auth account found for ${email}. Password reset cannot be sent.`);

      return new Response(
        JSON.stringify({
          error: "Compte non activé",
          message:
            "Cet utilisateur n'a pas encore activé son compte. Renvoyez plutôt une invitation d'activation.",
          action: "resend_invitation",
        }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // User exists in auth, generate recovery link normally
    console.log(`User ${email} exists in auth, generating recovery link...`);

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl,
      }
    });

    if (linkError) {
      console.error('Error generating reset link:', linkError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du lien de réinitialisation" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    resetLink = linkData.properties?.action_link || '';

    if (!resetLink) {
      console.error('No reset link generated');
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du lien" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Reset link generated successfully for ${email}`);

    const firstName = publicUser.first_name || 'Utilisateur';

    // TODO: Amazon SES email sending will be implemented here
    // For now, email sending is disabled - will be replaced with Amazon SES
    console.log(`[send-password-reset] ⚠️ Email sending disabled - Amazon SES integration pending`);
    console.log(`[send-password-reset] Email template data:`, {
      to: email,
      subject: "Réinitialisez votre mot de passe NECTFORMA",
      firstName,
      resetLink
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lien de réinitialisation généré (email désactivé - en attente d'Amazon SES)",
        resetLink: resetLink, // Return link for admin to share manually
        email_pending: true
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
