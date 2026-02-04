import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteSuperAdminRequest {
  email: string;
  first_name?: string;
  last_name?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is a super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is super admin
    const { data: callerRoles } = await supabaseAdmin
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin");

    if (!callerRoles || callerRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Seuls les Super Admins peuvent inviter d'autres Super Admins" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: InviteSuperAdminRequest = await req.json();
    const { email, first_name = "Super", last_name = "Admin" } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Inviting super admin: ${email}`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`User already exists: ${userId}`);
    } else {
      // Create auth user with magic link
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: {
          first_name,
          last_name,
          is_super_admin: true
        }
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw new Error(`Erreur lors de la création: ${createError.message}`);
      }

      userId = newUser.user.id;
      console.log(`Created new user: ${userId}`);
    }

    // Check if already super admin
    const { data: existingRole } = await supabaseAdmin
      .from("platform_user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .single();

    if (existingRole) {
      return new Response(
        JSON.stringify({ error: "Cet utilisateur est déjà Super Admin" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign super_admin role
    const { error: roleError } = await supabaseAdmin
      .from("platform_user_roles")
      .insert({
        user_id: userId,
        role: "super_admin",
        granted_by: caller.id
      });

    if (roleError) {
      console.error("Error assigning role:", roleError);
      throw new Error(`Erreur lors de l'attribution du rôle: ${roleError.message}`);
    }

    // Generate password reset link for activation
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${req.headers.get("origin") || "https://nectforma.com"}/reset-password`
      }
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
    }

    // Send invitation email via Brevo
    if (brevoApiKey && resetData?.properties?.action_link) {
      const activationLink = resetData.properties.action_link;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:40px;margin-bottom:40px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <div style="background:linear-gradient(135deg,#8B5CF6 0%,#6D28D9 100%);padding:40px 30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">🔐 Super Admin Invitation</h1>
              <p style="color:rgba(255,255,255,0.9);margin-top:10px;font-size:16px;">Bienvenue dans l'équipe Nectforma</p>
            </div>
            <div style="padding:40px 30px;">
              <p style="font-size:16px;color:#374151;margin-bottom:20px;">
                Bonjour <strong>${first_name}</strong>,
              </p>
              <p style="font-size:16px;color:#374151;margin-bottom:30px;">
                Vous avez été invité(e) à rejoindre la plateforme Nectforma en tant que <strong>Super Administrateur</strong>.
              </p>
              <p style="font-size:16px;color:#374151;margin-bottom:30px;">
                Ce rôle vous donne un accès complet à l'administration de la plateforme, y compris la gestion du blog, du SEO et des analytics.
              </p>
              <div style="text-align:center;margin:30px 0;">
                <a href="${activationLink}" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6 0%,#6D28D9 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 14px rgba(139,92,246,0.4);">
                  Activer mon compte
                </a>
              </div>
              <p style="font-size:14px;color:#6B7280;margin-top:30px;">
                Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette invitation, ignorez cet email.
              </p>
            </div>
            <div style="background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="font-size:12px;color:#9ca3af;margin:0;">
                © ${new Date().getFullYear()} Nectforma. Tous droits réservés.
              </p>
              <p style="font-size:12px;color:#9ca3af;margin:10px 0 0 0;">
                <a href="https://nectforma.com/cgu" style="color:#8B5CF6;text-decoration:none;">CGU</a> · 
                <a href="https://nectforma.com/politique-confidentialite" style="color:#8B5CF6;text-decoration:none;">Politique de confidentialité</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "api-key": brevoApiKey,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            sender: { name: "NECTFORMA", email: "noreply@nectforma.com" },
            to: [{ email }],
            subject: "🔐 Invitation Super Admin — Nectforma",
            htmlContent: emailHtml
          })
        });

        if (!emailResponse.ok) {
          console.error("Brevo error:", await emailResponse.text());
        } else {
          console.log("Invitation email sent successfully");
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation envoyée avec succès",
        userId 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Error in invite-super-admin:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
