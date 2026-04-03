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
        from: 'THYMOS <hello@thymos.fit>',
        to: email,
        subject: "You\u2019re on the list \u2014 THYMOS closed test invite coming soon",
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0A0A0B;color:#F0EDE8;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <p style="font-size:11px;letter-spacing:2px;color:#C8553D;font-weight:600;margin-bottom:24px;">THYMOS</p>

    <h1 style="font-size:20px;font-weight:700;margin:0 0 16px;line-height:1.3;">You&rsquo;re on the list &#128075;</h1>

    <p style="font-size:15px;line-height:1.7;color:#D0CEC9;margin:0 0 16px;">
      We&rsquo;ve received your sign-up. As soon as we add you to the closed test,
      <strong style="color:#F0EDE8;">we&rsquo;ll send your invite link directly to this email.</strong>
    </p>
    <p style="font-size:15px;line-height:1.7;color:#D0CEC9;margin:0 0 28px;">
      Sit tight &mdash; it won&rsquo;t be long. If you have any questions in the meantime, reach out at
      <a href="mailto:hello@thymos.fit" style="color:#C8553D;text-decoration:underline;">hello@thymos.fit</a>.
    </p>

    <hr style="border:none;border-top:1px solid #2A2A2B;margin:0 0 28px;">

    <p style="font-size:11px;letter-spacing:2px;color:#5A5856;font-weight:600;margin-bottom:16px;">&#127481;&#127479; T&Uuml;RK&Ccedil;E</p>

    <h2 style="font-size:18px;font-weight:700;margin:0 0 16px;">Listeye eklendin &#128075;</h2>

    <p style="font-size:15px;line-height:1.7;color:#D0CEC9;margin:0 0 16px;">
      Kay&#305;t&#305;n&#305; ald&#305;k. Seni kapal&#305; teste ekler eklemez
      <strong style="color:#F0EDE8;">davetiye linkini direkt bu adrese g&ouml;nderiyor olaca&#287;&#305;z.</strong>
    </p>
    <p style="font-size:15px;line-height:1.7;color:#D0CEC9;margin:0 0 28px;">
      Biraz bekle &mdash; uzun s&uuml;rmeyecek. Bu s&uuml;re&ccedil;te soru olursa
      <a href="mailto:hello@thymos.fit" style="color:#C8553D;text-decoration:underline;">hello@thymos.fit</a>
      adresinden ula&#351;abilirsin.
    </p>

    <p style="font-size:14px;color:#5A5856;margin:0;">Lift. Log. Own.</p>
    <p style="font-size:15px;font-weight:600;color:#F0EDE8;margin:16px 0 0;">Atakan ER</p>
    <p style="font-size:13px;color:#5A5856;margin:4px 0 0;">THYMOS Developer</p>
  </div>
</body>
</html>`,
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
