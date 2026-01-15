import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// TODO: Amazon SES integration will be added here
// import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

const getSubjectLabel = (subject: string): string => {
  const labels: Record<string, string> = {
    demo: "Demande de démonstration",
    devis: "Demande de devis",
    support: "Support technique",
    partenariat: "Partenariat",
    autre: "Autre",
  };
  return labels[subject] || subject;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, subject, message }: ContactFormRequest = await req.json();

    if (!firstName || !lastName || !email || !subject || !message) {
      throw new Error("Tous les champs sont requis");
    }

    const subjectLabel = getSubjectLabel(subject);

    console.log(`Processing contact form from: ${firstName} ${lastName} (${email})`);
    console.log(`Subject: ${subjectLabel}`);
    
    // TODO: Amazon SES email sending will be implemented here
    // For now, email sending is disabled - will be replaced with Amazon SES
    console.log(`[send-contact-form] ⚠️ Email sending disabled - Amazon SES integration pending`);
    console.log(`[send-contact-form] Email template data:`, {
      from: email,
      replyTo: email,
      to: "contact@nectforma.com",
      subject: `[Contact] ${subjectLabel} - ${firstName} ${lastName}`,
      messagePreview: message.substring(0, 100) + '...'
    });

    console.log("Contact form processed successfully (email pending Amazon SES)");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Message reçu (email de confirmation désactivé - en attente d'Amazon SES)",
        email_pending: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-contact-form function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
