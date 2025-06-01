import { createClient } from "@supabase/supabase-js";

const supa = createClient(
  process.env.SUPA_URL,
  process.env.SUPA_SERVICE_KEY     // service-role key (server only!)
);

/* verify Supabase JWT coming from the extension */
export async function getUser(jwt) {
  const { data, error } = await supa.auth.getUser(jwt);
  if (error || !data?.user) throw new Error("Invalid or expired token");
  return data.user;
}

/* read the row in `profiles` */
export async function getProfile(id) {
  const { data, error } = await supa
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/* mark user as subscribed (called by Razorpay webhook) */
export async function markSubscribed(id) {
  await supa
    .from("profiles")
    .update({ subscribed: true })
    .eq("id", id);
}
