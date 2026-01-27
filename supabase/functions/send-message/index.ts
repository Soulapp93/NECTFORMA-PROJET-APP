import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" };
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface RecipientPayload { type: "user" | "formation" | "all_instructors"; ids?: string[]; }
interface AttachmentPayload { file_name: string; file_url: string; file_size?: number; content_type?: string; }
interface SendMessagePayload { subject: string; content: string; is_draft?: boolean; scheduled_for?: string; recipients: RecipientPayload; attachments?: AttachmentPayload[]; }

function generateMessageEmailHtml(senderName: string, subject: string, recipientName: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background:#f4f4f7;"><table width="100%" style="padding:40px 20px;"><tr><td align="center"><table width="600" style="background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);padding:30px 40px;border-radius:12px 12px 0 0;"><h1 style="color:#fff;margin:0;font-size:24px;">NECTFORMA</h1></td></tr><tr><td style="padding:40px;"><p style="color:#374151;">Bonjour <strong>${recipientName}</strong>,</p><div style="background:#F3F4F6;border-left:4px solid #8B5CF6;padding:20px;border-radius:0 8px 8px 0;margin-bottom:24px;"><h2 style="color:#1F2937;font-size:18px;margin:0 0 12px;">📩 Nouveau message reçu</h2><p style="color:#4B5563;margin:0;"><strong>${senderName}</strong> vous a envoyé: "${subject}".</p></div><table width="100%"><tr><td align="center" style="padding:20px 0;"><a href="https://nectforme.lovable.app/messagerie" style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;">Lire le message</a></td></tr></table></td></tr><tr><td style="background:#F9FAFB;padding:24px 40px;border-radius:0 0 12px 12px;border-top:1px solid #E5E7EB;text-align:center;"><p style="color:#6B7280;font-size:13px;margin:0;">© ${new Date().getFullYear()} NECTFORMA</p></td></tr></table></td></tr></table></body></html>`;
}

async function sendEmailNotification(brevoApiKey: string, toEmail: string, toName: string, senderName: string, messageSubject: string): Promise<void> {
  try {
    await fetch(BREVO_API_URL, {
      method: "POST",
      headers: { "accept": "application/json", "api-key": brevoApiKey, "content-type": "application/json" },
      body: JSON.stringify({ sender: { name: "NECTFORMA", email: "noreply@nectforma.com" }, to: [{ email: toEmail, name: toName }], subject: `📩 Nouveau message de ${senderName} - NECTFORMA`, htmlContent: generateMessageEmailHtml(senderName, messageSubject, toName), tags: ["notification", "message"] }),
    });
    console.log(`Email sent to ${toEmail}`);
  } catch (error) { console.error("Error sending email:", error); }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });

    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });

    const userId = claimsData.claims.sub as string;
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const payload: SendMessagePayload = await req.json();
    const { subject, content, is_draft, scheduled_for, recipients, attachments } = payload;

    if (!subject || !content) return new Response(JSON.stringify({ error: "subject and content are required" }), { status: 400, headers: jsonHeaders });

    const { data: senderUser } = await supabaseAdmin.from("users").select("first_name, last_name").eq("id", userId).maybeSingle();
    let senderName = senderUser ? `${senderUser.first_name} ${senderUser.last_name}` : "Un utilisateur";

    const isScheduled = scheduled_for && new Date(scheduled_for) > new Date();
    const { data: message, error: messageError } = await supabaseAdmin.from("messages").insert({ sender_id: userId, subject, content, is_draft: is_draft ?? false, scheduled_for: scheduled_for ?? null, attachment_count: attachments?.length ?? 0, scheduled_recipients: isScheduled ? recipients : null }).select().single();
    if (messageError) return new Response(JSON.stringify({ error: messageError.message }), { status: 500, headers: jsonHeaders });

    const recipientRows: Array<{ message_id: string; recipient_id?: string; recipient_type: string; is_read?: boolean; read_at?: string | null }> = [];
    const emailRecipients: Array<{ email: string; name: string }> = [];
    recipientRows.push({ message_id: message.id, recipient_id: userId, recipient_type: "user", is_read: true, read_at: new Date().toISOString() });

    if (!isScheduled) {
      const addUserRecipients = async (userIds: string[]) => {
        for (const rid of Array.from(new Set(userIds)).filter(id => id && id !== userId)) {
          recipientRows.push({ message_id: message.id, recipient_id: rid, recipient_type: "user", is_read: false, read_at: null });
          const { data: u } = await supabaseAdmin.from("users").select("email, first_name, last_name").eq("id", rid).maybeSingle();
          if (u) emailRecipients.push({ email: u.email, name: `${u.first_name} ${u.last_name}` });
        }
      };

      if (recipients.type === "all_instructors") {
        const { data: u } = await supabaseAdmin.from("users").select("establishment_id").eq("id", userId).maybeSingle();
        if (u?.establishment_id) {
          const { data: instructors } = await supabaseAdmin.from("users").select("id").eq("establishment_id", u.establishment_id).eq("role", "Formateur");
          await addUserRecipients((instructors || []).map((i: any) => i.id));
        }
      } else if (recipients.type === "formation" && recipients.ids?.length) {
        const { data: assignments } = await supabaseAdmin.from("user_formation_assignments").select("user_id").in("formation_id", recipients.ids);
        if (assignments?.length) {
          const { data: students } = await supabaseAdmin.from("users").select("id").in("id", assignments.map((a: any) => a.user_id)).eq("role", "Étudiant");
          await addUserRecipients((students || []).map((s: any) => s.id));
        }
      } else if (recipients.type === "user" && recipients.ids?.length) {
        await addUserRecipients(recipients.ids);
      }
    }

    if (recipientRows.length > 0) {
      const { error: recipientError } = await supabaseAdmin.from("message_recipients").insert(recipientRows);
      if (recipientError) { await supabaseAdmin.from("messages").delete().eq("id", message.id); return new Response(JSON.stringify({ error: recipientError.message }), { status: 500, headers: jsonHeaders }); }
    }

    if (attachments?.length) {
      const { error: attachError } = await supabaseAdmin.from("message_attachments").insert(attachments.map(att => ({ message_id: message.id, file_name: att.file_name, file_url: att.file_url, file_size: att.file_size ?? null, content_type: att.content_type ?? null })));
      if (attachError) { await supabaseAdmin.from("message_recipients").delete().eq("message_id", message.id); await supabaseAdmin.from("messages").delete().eq("id", message.id); return new Response(JSON.stringify({ error: attachError.message }), { status: 500, headers: jsonHeaders }); }
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (brevoApiKey && emailRecipients.length > 0 && !is_draft) {
      Promise.all(emailRecipients.map(r => sendEmailNotification(brevoApiKey, r.email, r.name, senderName, subject))).catch(console.error);
    }

    return new Response(JSON.stringify({ success: true, message, isScheduled }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: jsonHeaders });
  }
});
