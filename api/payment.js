// api/payment.js
export default function handler(req, res) {
  const { order_id, email } = req.query;
  if (!order_id) return res.status(400).send("Missing order_id");

  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(/* html */`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>DeepLookup – Payment</title>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
<h3>Loading Razorpay…</h3>

<script>
  const rz = new Razorpay({
    key:       "${process.env.RAZORPAY_KEY_ID}",
    order_id:  "${order_id}",
    amount:    ${process.env.RAZORPAY_PRICE_PAISE},
    currency:  "INR",
    name:      "DeepLookup Pro",
    prefill:   { email: "${email || ""}" },
    theme:     { color: "#007aff" },
    handler () { document.body.innerHTML = "<h2>Payment complete! You may close this tab.</h2>"; }
  });
  rz.open();
</script>
</body>
</html>
  `);
}
