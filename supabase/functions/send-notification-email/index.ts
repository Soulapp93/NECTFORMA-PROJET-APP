import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// TODO: Amazon SES integration will be added here
// import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  userEmails: string[];
  title: string;
  message: string;
  type: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmails, title, message, type }: EmailNotificationRequest = await req.json();

    if (!userEmails || !Array.isArray(userEmails) || userEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing user emails" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing email notifications for ${userEmails.length} users`);

    // TODO: Amazon SES email sending will be implemented here
    // For now, email sending is disabled - will be replaced with Amazon SES
    console.log(`[send-notification-email] ⚠️ Email sending disabled - Amazon SES integration pending`);
    console.log(`[send-notification-email] Email template data:`, {
      recipients: userEmails,
      subject: `NECTFORMA - ${title}`,
      type,
      messagePreview: message.substring(0, 100) + '...'
    });

    // Simulate success for all recipients
    const results = userEmails.map(email => ({ email, success: true, pending: true }));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications préparées pour ${userEmails.length} utilisateur(s) (envoi désactivé - en attente d'Amazon SES)`,
        email_pending: true,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
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
