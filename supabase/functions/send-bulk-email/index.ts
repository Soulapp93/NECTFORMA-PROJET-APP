import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// TODO: Amazon SES integration will be added here
// import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkEmailRequest {
  recipients: { email: string; firstName: string; lastName: string }[];
  subject: string;
  message: string;
  senderName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, subject, message, senderName }: BulkEmailRequest = await req.json();

    console.log(`Processing bulk email to ${recipients.length} recipients`);

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one recipient is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!subject || !message) {
      return new Response(
        JSON.stringify({ error: "Subject and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // TODO: Amazon SES email sending will be implemented here
    // For now, email sending is disabled - will be replaced with Amazon SES
    console.log(`[send-bulk-email] ⚠️ Email sending disabled - Amazon SES integration pending`);
    console.log(`[send-bulk-email] Email template data:`, {
      recipients: recipients.map(r => r.email),
      subject,
      senderName,
      messagePreview: message.substring(0, 100) + '...'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${recipients.length} email(s) préparé(s) (envoi désactivé - en attente d'Amazon SES)`,
        email_pending: true,
        details: {
          success: recipients.length,
          failed: 0,
          errors: []
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-bulk-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
