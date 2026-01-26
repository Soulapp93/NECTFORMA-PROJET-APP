import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json; charset=utf-8",
};

interface RecipientPayload {
  type: "user" | "formation" | "all_instructors";
  ids?: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Processing scheduled messages...");

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find all scheduled messages that are due (scheduled_for <= now)
    const now = new Date().toISOString();
    const { data: scheduledMessages, error: fetchError } = await supabaseAdmin
      .from("messages")
      .select("*")
      .not("scheduled_for", "is", null)
      .not("scheduled_recipients", "is", null)
      .lte("scheduled_for", now)
      .eq("is_draft", false);

    if (fetchError) {
      console.error("Error fetching scheduled messages:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500, headers: jsonHeaders });
    }

    if (!scheduledMessages || scheduledMessages.length === 0) {
      console.log("No scheduled messages to process");
      return new Response(JSON.stringify({ success: true, processed: 0 }), { status: 200, headers: jsonHeaders });
    }

    console.log(`Found ${scheduledMessages.length} scheduled messages to process`);

    let processedCount = 0;
    let errorCount = 0;

    for (const message of scheduledMessages) {
      try {
        console.log(`Processing message ${message.id}...`);
        
        const recipients = message.scheduled_recipients as RecipientPayload;
        const senderId = message.sender_id;

        // Resolve sender establishment
        const { data: senderUser } = await supabaseAdmin
          .from("users")
          .select("establishment_id")
          .eq("id", senderId)
          .maybeSingle();

        let establishmentId = senderUser?.establishment_id;
        
        if (!establishmentId) {
          const { data: senderTutor } = await supabaseAdmin
            .from("tutors")
            .select("establishment_id")
            .eq("id", senderId)
            .maybeSingle();
          establishmentId = senderTutor?.establishment_id;
        }

        // Build recipients list
        const recipientRows: Array<{ message_id: string; recipient_id: string; recipient_type: string; is_read: boolean; read_at: string | null }> = [];

        const addUserRecipients = (userIds: string[]) => {
          const unique = Array.from(new Set(userIds)).filter((id) => id && id !== senderId);
          for (const rid of unique) {
            recipientRows.push({
              message_id: message.id,
              recipient_id: rid,
              recipient_type: "user",
              is_read: false,
              read_at: null,
            });
          }
        };

        if (recipients.type === "all_instructors" && establishmentId) {
          const { data: instructors } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("establishment_id", establishmentId)
            .eq("role", "Formateur");

          console.log(`Found ${(instructors || []).length} instructors`);
          addUserRecipients((instructors || []).map((i: any) => i.id as string));
        } else if (recipients.type === "formation" && recipients.ids?.length) {
          const { data: assignments } = await supabaseAdmin
            .from("user_formation_assignments")
            .select("user_id")
            .in("formation_id", recipients.ids);

          if (assignments && assignments.length > 0) {
            const assignedUserIds = assignments.map((a: any) => a.user_id as string);
            
            const { data: students } = await supabaseAdmin
              .from("users")
              .select("id")
              .in("id", assignedUserIds)
              .eq("role", "Étudiant");

            console.log(`Found ${(students || []).length} students`);
            addUserRecipients((students || []).map((s: any) => s.id as string));
          }
        } else if (recipients.type === "user" && recipients.ids?.length) {
          addUserRecipients(recipients.ids);
        }

        // Insert recipients
        if (recipientRows.length > 0) {
          const { error: insertError } = await supabaseAdmin
            .from("message_recipients")
            .insert(recipientRows);

          if (insertError) {
            console.error(`Error inserting recipients for message ${message.id}:`, insertError);
            errorCount++;
            continue;
          }
          console.log(`Created ${recipientRows.length} recipients for message ${message.id}`);
        }

        // Clear scheduled_recipients to mark as processed
        const { error: updateError } = await supabaseAdmin
          .from("messages")
          .update({ scheduled_recipients: null })
          .eq("id", message.id);

        if (updateError) {
          console.error(`Error updating message ${message.id}:`, updateError);
          errorCount++;
          continue;
        }

        processedCount++;
        console.log(`Successfully processed message ${message.id}`);
      } catch (err) {
        console.error(`Error processing message ${message.id}:`, err);
        errorCount++;
      }
    }

    console.log(`Processed ${processedCount} messages, ${errorCount} errors`);
    return new Response(
      JSON.stringify({ success: true, processed: processedCount, errors: errorCount }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: jsonHeaders });
  }
});