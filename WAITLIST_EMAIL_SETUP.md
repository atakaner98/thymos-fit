# Waitlist Thank-You Email Setup

When someone joins the waitlist, they receive an automatic thank-you email.

## 1. Resend Account & API Key

1. Go to [resend.com](https://resend.com) and sign up.
2. API Keys -> Create API Key -> Copy the key. It starts with `re_`.
3. Save it in your hosting provider as `RESEND_API_KEY`.

## 2. Deploy thymos-fit

Push the `functions/` folder to GitHub so Cloudflare deploys it:

```bash
cd c:\projects\thymos-fit
git add functions/
git commit -m "Add waitlist thank-you email webhook"
git push origin main
```

## 3. Cloudflare Secret

1. Cloudflare Dashboard -> Workers & Pages -> `thymos-fit`.
2. Settings -> Variables and Secrets.
3. Add:
   - Name: `RESEND_API_KEY`
   - Value: your Resend API key (`re_...`)
   - Type: Secret
4. Redeploy if needed.

## 4. Supabase Database Webhook

1. Supabase Dashboard -> Database Webhooks.
2. Configure the webhook:
   - Name: `waitlist-thank-you`
   - Table: `public.waitlist`
   - Events: Insert
   - Method: POST
   - URL: `https://thymos.fit/api/waitlist-webhook`
   - Header: `Content-type: application/json`
3. Save.

## 5. Test

1. Go to `https://thymos.fit`.
2. Enter your email and join the waitlist.
3. Check Resend logs and your inbox for the thank-you email.

## Customizing the Email

Edit `functions/api/waitlist-webhook.js` to change the subject, body, or sender.
