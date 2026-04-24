/**
 * send-open-testing-invites.js
 *
 * Supabase waitlist'indeki herkese Open Testing daveti gönderir.
 * CSV'deki hazır promo kodları sırayla atanır ve Supabase'e kaydedilir.
 *
 * Kullanım:
 *   RESEND_API_KEY=re_xxx SUPABASE_SERVICE_KEY=eyJ... node scripts/send-open-testing-invites.js
 *
 * Kuru çalıştırma (mail atmaz, sadece eşleştirmeyi gösterir):
 *   DRY_RUN=true RESEND_API_KEY=re_xxx SUPABASE_SERVICE_KEY=eyJ... node scripts/send-open-testing-invites.js
 */

// ─── Yapılandırma ─────────────────────────────────────────────────────────────

const SUPABASE_URL    = 'https://fxdlscqifuicpawdzcdg.supabase.co';
const ANDROID_APP_LINK = 'https://play.google.com/store/apps/details?id=fit.thymos.app';

// Rate limiting — Resend free tier: 2 req/sn max
const DELAY_BETWEEN_EMAILS_MS = 600;

// CSV'den alınan hazır promo kodları
const PROMO_CODES = [
  '81UU1MDVRQB1V6AULH0HJ0C',
  '2QVFM4U6FJHAN4GN54VHP16',
  'RGNGZUX7JX28LS5V1NBGLPT',
  'WNZZW7UUEGQF232KNU4LHQR',
  'A8BR0EPGX3DLMADUJT09J91',
  'W13MD2ZCHY595FX8E6HLRLN',
  '931VQXQBG32VLMKTF8LBJK6',
  'PTF0B7P2D8RKYHF9DAQCMSX',
  '082WXJKA33ZWCNY4G9UDVLT',
  'Y7FV43TJACXJH8510UM17NV',
  '836BAYXN1RWWK3SPABZ96S9',
  'WTLBQCW0Y4GCKEBHTJKTJNP',
  'LF02HZ7JTTNFHLPPKZ9WAPX',
  'AXJC34B75NJPD33YTEU2YN1',
  'F3GWBSPULPNPDFL8CPNRRZH',
  '12C8QF8PWV0WS0D0FAV15TL',
  '128ER1VH2JMAAR575V9WK8Y',
  '7AZCHE6TM9FBSTKVBDJW9HS',
  'H0ZG8P2GWBVNYMHQMDXM1JK',
  'AUJVYQ5S89M3CUS930L9902',
  'TARW5RYKLVKYBU94NPQCTFE',
  'KHC0Q6CUJTBF210JRC8UPT4',
  'B0VJSNRPWMAHHWBGAV8DMB4',
  'THU1E2D9NX83XU518L2X1T9',
  'LP3SNSLD2YCKMKK3473W4DC',
  'JKASKZ23SGMRZY84FBLSY41',
  'SRG70HKTKM0X71MR6EJC4F7',
  'KNCDRYXLVAHSQTCJ140LPU4',
  'WPSCKGV3BAMANLTEAFWZAW6',
  'G0DPPS61FR47LNRE8UJM3SQ',
];

// ─── Ortam değişkenleri ───────────────────────────────────────────────────────

const RESEND_API_KEY       = process.env.RESEND_API_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DRY_RUN              = process.env.DRY_RUN === 'true';

if (!RESEND_API_KEY)       { console.error('❌  RESEND_API_KEY eksik'); process.exit(1); }
if (!SUPABASE_SERVICE_KEY) { console.error('❌  SUPABASE_SERVICE_KEY eksik'); process.exit(1); }

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Supabase işlemleri ───────────────────────────────────────────────────────

async function fetchWaitlist() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/waitlist?select=id,email&order=signed_up_at.asc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Waitlist çekilemedi: ${res.status} ${txt}`);
  }
  return res.json();
}

async function savePromoCode(waitlistId, email, promoCode) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/promo_codes`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      waitlist_id: waitlistId,
      email,
      code: promoCode,
      sent_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Promo kod kaydedilemedi (${email}): ${res.status} ${txt}`);
  }
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildEmailHtml(promoCode) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0A0A0B;color:#F0EDE8;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">

    <p style="font-size:11px;letter-spacing:2px;color:#C8553D;font-weight:600;margin-bottom:24px;">THYMOS</p>

    <h1 style="font-size:20px;font-weight:700;margin:0 0 16px;line-height:1.3;">Open Testing ba&#351;lad&#305; &#127381;</h1>

    <p style="font-size:15px;line-height:1.7;color:#D0CEC9;margin:0 0 16px;">
      Bekledi&#287;in an geldi. <strong style="color:#F0EDE8;">THYMOS Open Testing a&#231;&#305;ld&#305;</strong> &mdash;
      ve seni ilk davet edenler aras&#305;nday&#305;z.
    </p>

    <p style="font-size:15px;line-height:1.7;color:#D0CEC9;margin:0 0 24px;">
      A&#351;a&#287;&#305;daki promo kodunu uygulamaya girerek premium &#246;zelliklere eri&#351;ebilirsin:
    </p>

    <div style="background:#161617;border:1px solid #2A2A2B;border-radius:10px;padding:20px 24px;margin:0 0 28px;text-align:center;">
      <p style="font-size:11px;letter-spacing:2px;color:#5A5856;font-weight:600;margin:0 0 10px;">PROMO KODUN</p>
      <p style="font-size:22px;font-weight:700;letter-spacing:3px;color:#C8553D;margin:0;font-family:monospace;">${promoCode}</p>
    </div>

    <p style="font-size:14px;color:#D0CEC9;margin:0 0 16px;">Uygulama&#351;&#305; indir, hesab&#305;n&#305; a&#231; ve kodu gir:</p>

    <a href="${ANDROID_APP_LINK}"
       style="display:inline-block;background:#C8553D;color:#F0EDE8;text-decoration:none;font-size:13px;font-weight:600;padding:13px 24px;border-radius:8px;margin:0 0 28px;">
      &#8595;&nbsp;&nbsp;Google Play&rsquo;den &#304;ndir
    </a>

    <hr style="border:none;border-top:1px solid #2A2A2B;margin:0 0 24px;">

    <p style="font-size:14px;line-height:1.7;color:#D0CEC9;margin:0 0 8px;">
      Herhangi bir sorun ya&#351;arsan direkt
      <a href="mailto:hello@thymos.fit" style="color:#C8553D;text-decoration:underline;">hello@thymos.fit</a>
      adresinden ula&#351;abilirsin. Geri bildiriminle uygulama&#351;&#305; daha iyi hale getirmemize yard&#305;mc&#305; olacaks&#305;n.
    </p>

    <p style="font-size:14px;color:#5A5856;margin:28px 0 0;">Lift. Log. Own.</p>
    <p style="font-size:15px;font-weight:600;color:#F0EDE8;margin:16px 0 0;">Atakan ER</p>
    <p style="font-size:13px;color:#5A5856;margin:4px 0 0;">THYMOS Developer</p>

  </div>
</body>
</html>`;
}

// ─── Email gönderme ───────────────────────────────────────────────────────────

async function sendEmail(email, promoCode) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'THYMOS <hello@thymos.fit>',
      to: email,
      subject: 'THYMOS Open Testing başladı — promo kodun içerde 🎉',
      html: buildEmailHtml(promoCode),
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Resend hatası: ${res.status} ${txt}`);
  }
  return res.json();
}

// ─── Ana akış ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? '🔍  DRY RUN — mail gönderilmeyecek\n' : '🚀  Gönderme başlıyor...\n');

  const waitlist = await fetchWaitlist();
  console.log(`📋  Waitlist: ${waitlist.length} kişi  |  Promo kodu: ${PROMO_CODES.length} adet\n`);

  if (waitlist.length === 0) {
    console.log('Liste boş, çıkılıyor.');
    return;
  }

  if (waitlist.length > PROMO_CODES.length) {
    console.error(`❌  Promo kodu yetersiz: ${waitlist.length} kişi var, ${PROMO_CODES.length} kod var.`);
    process.exit(1);
  }

  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < waitlist.length; i++) {
    const { id, email } = waitlist[i];
    const promoCode = PROMO_CODES[i];
    const prefix = `[${i + 1}/${waitlist.length}]`;

    if (DRY_RUN) {
      console.log(`${prefix}  ${email}  →  ${promoCode}`);
      results.success++;
      continue;
    }

    try {
      await savePromoCode(id, email, promoCode);
      await sendEmail(email, promoCode);
      console.log(`${prefix} ✅  ${email}  →  ${promoCode}`);
      results.success++;
    } catch (err) {
      console.error(`${prefix} ❌  ${email}  →  ${err.message}`);
      results.failed++;
      results.errors.push({ email, error: err.message });
    }

    if (i < waitlist.length - 1) {
      await sleep(DELAY_BETWEEN_EMAILS_MS);
    }
  }

  console.log('\n─── Özet ───────────────────────────────');
  console.log(`✅  Başarılı : ${results.success}`);
  console.log(`❌  Başarısız: ${results.failed}`);
  if (results.errors.length > 0) {
    console.log('\nHatalı adresler:');
    results.errors.forEach(({ email, error }) => console.log(`  ${email}: ${error}`));
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
