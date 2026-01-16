import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-password-reset: Starting...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const body: PasswordResetRequest = await req.json();
    const { email, redirectUrl } = body;

    console.log("send-password-reset: Processing for:", email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists in the users table (get most recent if multiple)
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, is_activated, establishment_id')
      .eq('email', normalizedEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    if (userError) {
      console.error("send-password-reset: Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification de l'utilisateur" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = users && users.length > 0 ? users[0] : null;

    if (!user) {
      console.log("send-password-reset: User not found:", normalizedEmail);
      // Return success anyway to prevent email enumeration
      return new Response(
        JSON.stringify({ success: true, message: "Si l'email existe, un lien a été envoyé" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is activated
    if (!user.is_activated) {
      console.log("send-password-reset: User not activated:", normalizedEmail);
      return new Response(
        JSON.stringify({ 
          error: "Compte non activé",
          action: "resend_invitation"
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user exists in auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error("send-password-reset: Error listing auth users:", authError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUser = authUsers?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
    
    if (!authUser) {
      console.log("send-password-reset: Auth user not found:", normalizedEmail);
      return new Response(
        JSON.stringify({ 
          error: "Compte non activé",
          action: "resend_invitation"
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate password reset link
    const finalRedirectUrl = redirectUrl || "https://nectforme.lovable.app/reset-password";
    
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: finalRedirectUrl
      }
    });

    if (resetError) {
      console.error("send-password-reset: Error generating reset link:", resetError);
      return new Response(
        JSON.stringify({ error: "Impossible de générer le lien de réinitialisation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resetLink = resetData?.properties?.action_link;
    
    if (!resetLink) {
      console.error("send-password-reset: No reset link generated");
      return new Response(
        JSON.stringify({ error: "Impossible de générer le lien" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("send-password-reset: Reset link generated successfully");

    // If Resend is configured, send email
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const displayName = `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">NectForMe</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Réinitialisation du mot de passe</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Bonjour ${displayName} !</h2>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Réinitialiser mon mot de passe
                </a>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Ce lien expirera dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
              </p>
            </div>
            
            <p style="color: #888; font-size: 12px; text-align: center; margin: 20px 0 0 0;">
              © 2024 NectForMe. Tous droits réservés.
            </p>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: `NectForMe <${fromEmail}>`,
          to: [normalizedEmail],
          subject: "Réinitialisation de votre mot de passe NectForMe",
          html: htmlContent,
        });

        if (emailResponse.error) {
          console.error("send-password-reset: Resend error:", emailResponse.error);
          // Return the link anyway for manual use
          return new Response(
            JSON.stringify({ 
              success: true, 
              email_pending: true,
              resetLink,
              message: "Email non envoyé, utilisez le lien ci-dessous"
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("send-password-reset: Email sent successfully via Resend");
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Email de réinitialisation envoyé"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (emailError: any) {
        console.error("send-password-reset: Email sending failed:", emailError);
        return new Response(
          JSON.stringify({ 
            success: true, 
            email_pending: true,
            resetLink,
            message: "Email non envoyé, lien généré"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Resend not configured - return link for manual use
    console.log("send-password-reset: Resend not configured, returning link");
    return new Response(
      JSON.stringify({ 
        success: true, 
        email_pending: true,
        resetLink,
        message: "Lien généré (email non configuré)"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("send-password-reset: Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur inattendue s'est produite" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
