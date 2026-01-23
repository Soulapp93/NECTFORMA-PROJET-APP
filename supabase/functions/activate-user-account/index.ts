import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivateAccountRequest {
  token: string;
  password: string;
}

const findAuthUserIdByEmail = async (supabase: ReturnType<typeof createClient>, email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const perPage = 1000;
  const maxPages = 25; // hard safety limit

  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users ?? [];
    const found = users.find((u) => (u.email ?? '').toLowerCase() === normalizedEmail);
    if (found?.id) return found.id;

    if (users.length < perPage) break;
  }

  return null;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { token, password }: ActivateAccountRequest = await req.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: "Token et mot de passe requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Processing account activation for token:", token.substring(0, 8) + "...");

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Le mot de passe doit contenir au moins 8 caractères" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find and validate activation token
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_activation_tokens')
      .select('*, users!inner(id, email, first_name, last_name, role, establishment_id)')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.error("Token validation error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Token d'activation invalide ou expiré" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = tokenData.users;
    const userId = tokenData.user_id as string;

    console.log("Activating account for user:", user.email, "userId:", userId);

    // Find Auth user reliably (pagination safe)
    const existingAuthUserId = await findAuthUserIdByEmail(supabase, user.email);
    let authUserId: string | null = existingAuthUserId;

    if (authUserId) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
        password,
        email_confirm: true,
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          establishment_id: user.establishment_id,
        },
      });

      if (updateError) {
        console.error("Error updating auth user:", updateError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la mise à jour du compte" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      // Fallback: if Auth user doesn't exist, create it
      const { data: createdAuth, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          establishment_id: user.establishment_id,
        },
      });

      if (createError || !createdAuth?.user?.id) {
        console.error("Error creating auth user:", createError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la création du compte: " + (createError?.message || "inconnue") }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      authUserId = createdAuth.user.id;
    }

    if (!authUserId) {
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création/mise à jour du compte utilisateur" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update public profile row (do NOT attempt to change the primary key id)
    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        is_activated: true,
        status: "Actif",
      })
      .eq("id", userId);

    if (updateUserError) {
      console.error("Error updating public.users activation flags:", updateUserError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la mise à jour du profil utilisateur" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark token as used
    await supabase
      .from('user_activation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    console.log("Account activated successfully for user:", authUserId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authUserId,
        email: user.email,
        message: "Compte activé avec succès" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in activate-user-account function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
