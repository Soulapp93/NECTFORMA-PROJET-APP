import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

// Version for deployment verification
const VERSION = "v2.1.0";

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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    const { token, password }: ActivateAccountRequest = await req.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: "Token et mot de passe requis", _version: VERSION }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[${VERSION}] Processing account activation for token:`, token.substring(0, 8) + "...");

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Le mot de passe doit contenir au moins 8 caractères", _version: VERSION }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const nowIso = new Date().toISOString();

    // Step 1: Get the token data (WITHOUT join - no foreign key relationship)
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_activation_tokens')
      .select('user_id, token, expires_at, used_at')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', nowIso)
      .single();

    if (tokenError || !tokenData) {
      console.error(`[${VERSION}] ❌ Token validation error:`, tokenError);
      return new Response(
        JSON.stringify({ error: "Token d'activation invalide ou expiré", _version: VERSION }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[${VERSION}] ✅ Token valid, fetching user:`, tokenData.user_id);

    // Step 2: Get the user data separately
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, establishment_id')
      .eq('id', tokenData.user_id)
      .single();

    if (userError || !userData) {
      console.error(`[${VERSION}] ❌ User not found:`, userError);
      return new Response(
        JSON.stringify({ error: "Utilisateur introuvable", _version: VERSION }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = userData.id;
    console.log(`[${VERSION}] ✅ Activating account for user:`, userData.email);

    // Find Auth user reliably (pagination safe)
    const existingAuthUserId = await findAuthUserIdByEmail(supabase, userData.email);
    let authUserId: string | null = existingAuthUserId;

    if (authUserId) {
      console.log(`[${VERSION}] 🔄 Updating existing auth user:`, authUserId);
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
        password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          establishment_id: userData.establishment_id,
        },
      });

      if (updateError) {
        console.error(`[${VERSION}] ❌ Error updating auth user:`, updateError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la mise à jour du compte", _version: VERSION }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      // Fallback: if Auth user doesn't exist, create it
      console.log(`[${VERSION}] ➕ Creating new auth user for:`, userData.email);
      const { data: createdAuth, error: createError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          establishment_id: userData.establishment_id,
        },
      });

      if (createError || !createdAuth?.user?.id) {
        console.error(`[${VERSION}] ❌ Error creating auth user:`, createError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la création du compte: " + (createError?.message || "inconnue"), _version: VERSION }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      authUserId = createdAuth.user.id;
    }

    if (!authUserId) {
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création/mise à jour du compte utilisateur", _version: VERSION }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update public profile row
    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        is_activated: true,
        status: "Actif",
      })
      .eq("id", userId);

    if (updateUserError) {
      console.error(`[${VERSION}] ❌ Error updating public.users activation flags:`, updateUserError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la mise à jour du profil utilisateur", _version: VERSION }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark token as used
    await supabase
      .from('user_activation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    console.log(`[${VERSION}] ✅ Account activated successfully for user:`, authUserId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authUserId,
        email: userData.email,
        message: "Compte activé avec succès",
        _version: VERSION
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error(`[${VERSION}] ❌ Critical error:`, error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne du serveur", _version: VERSION }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
