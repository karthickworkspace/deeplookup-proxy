import { getUser, getProfile } from "./auth.js";

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  /* JWT from extension */
  const jwt = req.headers.authorization?.replace("Bearer ", "");
  if (!jwt) return res.status(401).json({ error: "Not logged in" });

  try {
    const user    = await getUser(jwt);
    const profile = await getProfile(user.id);

    const trialEnds = new Date(profile.trial_start).getTime() + FIVE_DAYS_MS;
    const trialOver = Date.now() > trialEnds;

    if (!profile.subscribed && trialOver) {
      return res.status(402).json({ error: "Trial over — please upgrade." });
    }

    /* forward to deepseek route */
    const forward = await fetch(
      `${process.env.INTERNAL_URL}/api/deepseek`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(req.body)
      }
    );

    return res.status(forward.status).send(await forward.text());

  } catch (e) {
    console.error("Quota error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
