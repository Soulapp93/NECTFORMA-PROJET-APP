import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// TODO: Amazon SES integration will be added here
// import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivationRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  establishmentId: string;
}

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    'Admin': 'Administrateur',
    'AdminPrincipal': 'Administrateur Principal',
    'Formateur': 'Formateur',
    'Étudiant': 'Étudiant',
  };
  return labels[role] || role;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { userId, email, firstName, lastName, role, establishmentId }: ActivationRequest = await req.json();

    console.log("Creating activation token for user:", email);

    // Validate required fields
    if (!userId || !email || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: "Champs requis manquants" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get establishment name
    const { data: establishment } = await supabase
      .from('establishments')
      .select('name')
      .eq('id', establishmentId)
      .single();

    const establishmentName = establishment?.name || 'NECTFORMA';

    // Generate unique activation token
    const token = crypto.randomUUID() + '-' + Date.now();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Insert activation token
    const { error: tokenError } = await supabase
      .from('user_activation_tokens')
      .insert({
        user_id: userId,
        token: token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error("Token creation error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du token d'activation" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate activation link
    const baseUrl = req.headers.get('origin') || 'https://nectforma.com';
    const activationLink = `${baseUrl}/activation?token=${token}`;

    console.log(`[send-user-activation] Activation link: ${activationLink}`);
    
    // TODO: Amazon SES email sending will be implemented here
    // For now, email sending is disabled - will be replaced with Amazon SES
    console.log(`[send-user-activation] ⚠️ Email sending disabled - Amazon SES integration pending`);
    console.log(`[send-user-activation] Email template data:`, {
      to: email,
      subject: `Activez votre compte ${establishmentName} - NECTFORMA`,
      firstName,
      lastName,
      role: getRoleLabel(role),
      establishmentName,
      activationLink
    });

    // Update user to mark invitation sent
    await supabase
      .from('users')
      .update({ invitation_sent_at: new Date().toISOString() })
      .eq('id', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Token d'activation créé (email désactivé - en attente d'Amazon SES)",
        activationLink: activationLink,
        email_pending: true
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[send-user-activation] Critical error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erreur interne du serveur",
        stack: error.stack 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
