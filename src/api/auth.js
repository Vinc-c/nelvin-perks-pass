// Authentication helpers on top of Supabase Auth.
// The app-level "user" is the auth user merged with their `profiles` row.
import { supabase } from "./supabaseClient";

const authError = (error, fallback) => {
  const err = new Error(error?.message || fallback);
  err.status = error?.status;
  return err;
};

/** Current user (auth + profile) or null when signed out. */
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const authUser = session.user;

  let { data: profile, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
  if (error) throw authError(error, "Impossible de charger le profil");
  if (!profile) {
    // Should not happen (created by DB trigger) — degrade gracefully.
    profile = { id: authUser.id, role: "MEMBER", onboarded: false, wallet_balance: 0, wallet_currency: "USD" };
  }
  return {
    ...profile,
    id: authUser.id,
    email: profile.email || authUser.email,
    full_name: profile.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
  };
}

/** Updates the signed-in user's own profile (protected fields are blocked server-side). */
export async function updateMe(values) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");
  const { data, error } = await supabase.from("profiles").update(values).eq("id", user.id).select().maybeSingle();
  if (error) throw authError(error, "Impossible d'enregistrer");
  return data;
}

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    if (error.code === "email_not_confirmed") throw authError(error, "Veuillez d'abord confirmer votre email.");
    throw authError(error, "Email ou mot de passe invalide");
  }
  return data;
}

/**
 * Creates an account. Supabase sends a confirmation email containing a
 * 6-digit code (the "Confirm signup" template must include {{ .Token }}).
 * Returns { needsVerification } — false when email confirmation is disabled.
 */
export async function signUp({ email, password, metadata = {} }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: metadata, emailRedirectTo: `${window.location.origin}/app` },
  });
  if (error) throw authError(error, "Inscription impossible");
  // Supabase returns a user with no identities when the email already exists.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("Un compte existe déjà avec cet email. Connectez-vous.");
  }
  return { needsVerification: !data.session, session: data.session };
}

export async function verifySignupOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: "signup" });
  if (error) throw authError(error, "Code de vérification invalide");
  return data;
}

export async function resendSignupOtp(email) {
  const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
  if (error) throw authError(error, "Impossible de renvoyer le code");
}

/** Google sign-in; `redirectPath` is a same-origin path to land on afterwards. */
export async function signInWithGoogle(redirectPath = "/app") {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}${redirectPath}` },
  });
  if (error) throw authError(error, "Connexion Google impossible");
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw authError(error, "Impossible d'envoyer l'email");
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw authError(error, "Impossible de modifier le mot de passe");
}

export async function signOut(redirectTo) {
  await supabase.auth.signOut().catch(() => {});
  if (redirectTo) window.location.href = redirectTo;
}
