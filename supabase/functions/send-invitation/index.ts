import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// TODO: Amazon SES integration will be added here
// import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  establishment_id: string;
  created_by: string;
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
    
    const { email, first_name, last_name, role, establishment_id, created_by }: InvitationRequest = await req.json();

    console.log("Creating invitation for:", email, "role:", role);

    // Validate required fields
    if (!email || !role || !establishment_id || !created_by) {
      return new Response(
        JSON.stringify({ error: "Champs requis manquants" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('establishment_id', establishment_id)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Un utilisateur avec cet email existe déjà dans cet établissement" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('establishment_id', establishment_id)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return new Response(
        JSON.stringify({ error: "Une invitation est déjà en attente pour cet email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get establishment name
    const { data: establishment } = await supabase
      .from('establishments')
      .select('name')
      .eq('id', establishment_id)
      .single();

    if (!establishment) {
      return new Response(
        JSON.stringify({ error: "Établissement non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate secure token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_invitation_token');

    if (tokenError || !tokenData) {
      console.error("Token generation error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du token" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = tokenData;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email,
        first_name,
        last_name,
        role,
        token,
        establishment_id,
        created_by,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Invitation creation error:", invitationError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de l'invitation" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate invitation link
    const baseUrl = req.headers.get('origin') || 'https://nectforma.com';
    const invitationLink = `${baseUrl}/accept-invitation?token=${token}`;

    console.log(`[send-invitation] Invitation created for ${email}`);
    console.log(`[send-invitation] Invitation link: ${invitationLink}`);
    
    // TODO: Amazon SES email sending will be implemented here
    // For now, email sending is disabled - will be replaced with Amazon SES
    console.log(`[send-invitation] ⚠️ Email sending disabled - Amazon SES integration pending`);
    console.log(`[send-invitation] Email template data:`, {
      to: email,
      subject: `Invitation à rejoindre ${establishment.name} sur NECTFORMA`,
      firstName: first_name || 'Utilisateur',
      establishmentName: establishment.name,
      role: getRoleLabel(role),
      invitationLink
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation_id: invitation.id,
        invitation_link: invitationLink,
        message: "Invitation créée (email désactivé - en attente d'Amazon SES)",
        email_pending: true
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
