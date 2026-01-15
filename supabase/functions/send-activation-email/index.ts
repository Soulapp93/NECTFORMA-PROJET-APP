import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// TODO: Amazon SES integration will be added here
// import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ActivationEmailRequest {
  email: string;
  token: string;
  firstName: string;
  lastName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, firstName, lastName }: ActivationEmailRequest = await req.json();

    // URL d'activation
    const activationUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/activation?token=${token}`;

    console.log(`Processing activation email request for: ${email}`);
    console.log(`Activation URL: ${activationUrl}`);
    
    // TODO: Amazon SES email sending will be implemented here
    // For now, email sending is disabled - will be replaced with Amazon SES
    console.log(`[send-activation-email] ⚠️ Email sending disabled - Amazon SES integration pending`);
    console.log(`[send-activation-email] Email template data:`, {
      to: email,
      subject: "Activez votre compte NECTFORMA",
      firstName,
      lastName,
      activationUrl
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Activation préparée (email désactivé - en attente d'Amazon SES)",
        activationUrl: activationUrl,
        email_pending: true
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Erreur lors de la préparation de l'email d'activation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
