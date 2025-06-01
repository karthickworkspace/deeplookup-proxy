import Razorpay from "razorpay";
import { getUser } from "./auth.js";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const jwt = req.headers.authorization?.replace("Bearer ", "");
  if (!jwt) return res.status(401).json({ error: "Not logged in" });

  try {
    const user   = await getUser(jwt);
    const amount = Number(process.env.RAZORPAY_PRICE_PAISE || "9900"); // ₹199 default

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `dlkp_${user.id}_${Date.now()}`,
      notes: { user_id: user.id }
    });

    res.json({ order });
  } catch (e) {
    console.error("Razorpay order error:", e);
    res.status(500).json({ error: "Order creation failed" });
  }
}
