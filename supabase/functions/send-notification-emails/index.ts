import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface EmailNotificationRequest {
  type: 'assignment_reminder' | 'attendance_reminder' | 'bulk_notification';
  userIds?: string[];
  notificationData?: {
    subject: string;
    title: string;
    message: string;
    ctaText?: string;
    ctaUrl?: string;
  };
}

interface UserInfo {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

// Generate professional HTML email
function generateEmailHtml(
  title: string,
  message: string,
  recipientName: string,
  ctaText?: string,
  ctaUrl?: string,
  additionalInfo?: Record<string, string>
): string {
  const appUrl = 'https://nectforme.lovable.app';
  const fullCtaUrl = ctaUrl ? `${appUrl}${ctaUrl}` : appUrl;
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">NECTFORMA</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">Plateforme de gestion de formation</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Bonjour <strong>${recipientName}</strong>,
              </p>
              <div style="background-color: #F3F4F6; border-left: 4px solid #8B5CF6; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <h2 style="color: #1F2937; font-size: 18px; margin: 0 0 12px 0;">${title}</h2>
                <p style="color: #4B5563; font-size: 15px; margin: 0; line-height: 1.6;">${message}</p>
              </div>
              ${additionalInfo ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                ${Object.entries(additionalInfo).map(([key, value]) => `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                    <span style="color: #6B7280; font-size: 14px;">${key}</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                    <span style="color: #1F2937; font-size: 14px; font-weight: 500;">${value}</span>
                  </td>
                </tr>
                `).join('')}
              </table>
              ` : ''}
              ${ctaText ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${fullCtaUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">${ctaText}</a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 13px; margin: 0 0 8px 0; text-align: center;">
                Cet email a été envoyé automatiquement par NECTFORMA.
              </p>
              <p style="color: #9CA3AF; font-size: 12px; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} NECTFORMA. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Send email via Brevo
async function sendEmail(
  brevoApiKey: string,
  to: string,
  subject: string,
  htmlContent: string,
  tags: string[]
): Promise<boolean> {
  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "NECTFORMA", email: "noreply@nectforma.com" },
        to: [{ email: to }],
        subject,
        htmlContent,
        tags
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Brevo API error:", error);
      return false;
    }

    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: EmailNotificationRequest = await req.json();
    console.log("Email notification request:", body.type);

    let emailsSent = 0;
    let emailsFailed = 0;

    if (body.type === 'assignment_reminder') {
      // Find assignments due in the next 24-48 hours
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const { data: assignments, error: assignmentError } = await supabase
        .from('module_assignments')
        .select(`
          id, title, due_date, module_id,
          formation_modules!inner(id, title, formation_id)
        `)
        .gte('due_date', tomorrow.toISOString())
        .lte('due_date', dayAfterTomorrow.toISOString())
        .eq('is_published', true);

      if (assignmentError) {
        console.error("Error fetching assignments:", assignmentError);
      } else if (assignments && assignments.length > 0) {
        for (const assignment of assignments) {
          const module = (assignment as any).formation_modules;
          
          // Get students in the formation
          const { data: students, error: studentsError } = await supabase
            .from('user_formation_assignments')
            .select('user_id')
            .eq('formation_id', module.formation_id);

          if (studentsError || !students) continue;

          // Check who hasn't submitted yet
          const { data: submissions } = await supabase
            .from('assignment_submissions')
            .select('student_id')
            .eq('assignment_id', assignment.id);

          const submittedIds = new Set((submissions || []).map(s => s.student_id));
          const pendingStudentIds = students
            .map(s => s.user_id)
            .filter(id => !submittedIds.has(id));

          // Get user details and send emails
          for (const studentId of pendingStudentIds) {
            const { data: user } = await supabase
              .from('users')
              .select('email, first_name, last_name')
              .eq('id', studentId)
              .eq('role', 'Étudiant')
              .single();

            if (user) {
              const dueDate = new Date(assignment.due_date!);
              const hoursRemaining = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
              
              const htmlContent = generateEmailHtml(
                `⏰ Rappel: Devoir à rendre ${hoursRemaining <= 24 ? '(moins de 24h !)' : ''}`,
                `Le devoir "${assignment.title}" doit être rendu prochainement. N'oubliez pas de le soumettre avant la date limite.`,
                `${user.first_name} ${user.last_name}`,
                'Soumettre mon devoir',
                '/formations',
                {
                  'Module': module.title,
                  'Devoir': assignment.title,
                  'Date limite': dueDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }
              );

              const success = await sendEmail(
                brevoApiKey,
                user.email,
                `⏰ Rappel: Devoir "${assignment.title}" à rendre - NECTFORMA`,
                htmlContent,
                ['reminder', 'assignment']
              );

              if (success) emailsSent++;
              else emailsFailed++;
            }
          }
        }
      }
    }

    if (body.type === 'attendance_reminder') {
      // Find open attendance sheets without signatures
      const { data: openSheets, error: sheetsError } = await supabase
        .from('attendance_sheets')
        .select(`
          id, title, date, start_time, end_time, formation_id,
          formations!inner(id, title)
        `)
        .eq('is_open_for_signing', true)
        .eq('status', 'En cours');

      if (sheetsError) {
        console.error("Error fetching attendance sheets:", sheetsError);
      } else if (openSheets && openSheets.length > 0) {
        for (const sheet of openSheets) {
          // Get students in the formation
          const { data: students } = await supabase
            .from('user_formation_assignments')
            .select('user_id')
            .eq('formation_id', sheet.formation_id);

          if (!students) continue;

          // Get who already signed
          const { data: signatures } = await supabase
            .from('attendance_signatures')
            .select('user_id')
            .eq('attendance_sheet_id', sheet.id);

          const signedIds = new Set((signatures || []).map(s => s.user_id));
          const pendingStudentIds = students
            .map(s => s.user_id)
            .filter(id => !signedIds.has(id));

          // Send reminder emails
          for (const studentId of pendingStudentIds) {
            const { data: user } = await supabase
              .from('users')
              .select('email, first_name, last_name')
              .eq('id', studentId)
              .eq('role', 'Étudiant')
              .single();

            if (user) {
              const htmlContent = generateEmailHtml(
                "⏰ N'oubliez pas de signer !",
                `Vous n'avez pas encore signé votre présence pour la session "${sheet.title}". L'émargement est toujours ouvert.`,
                `${user.first_name} ${user.last_name}`,
                'Signer maintenant',
                '/emargement',
                {
                  'Session': sheet.title,
                  'Date': new Date(sheet.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
                  'Horaires': `${sheet.start_time} - ${sheet.end_time}`
                }
              );

              const success = await sendEmail(
                brevoApiKey,
                user.email,
                `⏰ Rappel émargement: ${sheet.title} - NECTFORMA`,
                htmlContent,
                ['reminder', 'attendance']
              );

              if (success) emailsSent++;
              else emailsFailed++;
            }
          }
        }
      }
    }

    if (body.type === 'bulk_notification' && body.userIds && body.notificationData) {
      for (const userId of body.userIds) {
        // Try users table first
        let user: UserInfo | null = null;
        
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, first_name, last_name')
          .eq('id', userId)
          .single();

        if (userData) {
          user = userData;
        } else {
          // Try tutors table
          const { data: tutorData } = await supabase
            .from('tutors')
            .select('id, email, first_name, last_name')
            .eq('id', userId)
            .single();

          if (tutorData) {
            user = tutorData;
          }
        }

        if (user) {
          const htmlContent = generateEmailHtml(
            body.notificationData.title,
            body.notificationData.message,
            `${user.first_name} ${user.last_name}`,
            body.notificationData.ctaText,
            body.notificationData.ctaUrl
          );

          const success = await sendEmail(
            brevoApiKey,
            user.email,
            body.notificationData.subject,
            htmlContent,
            ['notification', 'bulk']
          );

          if (success) emailsSent++;
          else emailsFailed++;
        }
      }
    }

    console.log(`Email notifications complete: ${emailsSent} sent, ${emailsFailed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emails_sent: emailsSent, 
        emails_failed: emailsFailed 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-notification-emails:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
