/**
 * Supabase Database Webhook handler — sends thank-you email via Resend
 * when a row is inserted into the waitlist table.
 *
 * Configure in Supabase: Database → Webhooks → Create
 * - Table: waitlist
 * - Events: INSERT
 * - URL: https://thymos-fit.vercel.app/api/waitlist-webhook
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const record = body?.record ?? body?.payload?.record;
    const email = record?.email;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'No email in payload' });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.WAITLIST_FROM || 'THYMOS <onboarding@resend.dev>',
        to: email,
        subject: "You're on the launch list — THYMOS",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0A0A0B;color:#F0EDE8;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
    <p style="font-size:11px;letter-spacing:2px;color:#C8553D;font-weight:600;margin-bottom:24px;">THYMOS</p>
    <h1 style="font-size:24px;font-weight:700;margin:0 0 16px;line-height:1.3;">Thanks for your interest.</h1>
    <p style="font-size:16px;line-height:1.7;color:#8E8C87;margin:0 0 24px;">
      You're on the launch list. We'll email you when THYMOS is ready. If you want to be removed, reply to this email or contact hello@thymos.fit.
    </p>
    <p style="font-size:14px;color:#5A5856;margin:0;">
      Lift. Log. Own.
    </p>
  </div>
</body>
</html>
        `.trim(),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend error:', response.status, errText);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
