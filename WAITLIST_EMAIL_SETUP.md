# Waitlist Thank-You Email Setup

When someone joins the waitlist, they receive an automatic thank-you email (in English).

## 1. Resend Account & API Key

1. Go to [resend.com](https://resend.com) and sign up (free tier: 100 emails/day).
2. **API Keys** → Create API Key → Copy the key (starts with `re_`).
3. Save it; you'll add it to Vercel in step 3.

## 2. Deploy thymos-fit

Push the new `api/` folder to GitHub so Vercel deploys it:

```bash
cd c:\projects\thymos-fit
git add api/
git commit -m "Add waitlist thank-you email webhook"
git push origin main
```

## 3. Vercel Environment Variable

1. [Vercel Dashboard](https://vercel.com) → your thymos-fit project.
2. **Settings** → **Environment Variables**.
3. Add:
   - **Name:** `RESEND_API_KEY`
   - **Value:** your Resend API key (`re_...`)
   - **Environment:** Production (and Preview if you want to test).
4. Redeploy (Deployments → ⋯ → Redeploy).

## 4. Supabase Database Webhook

1. [Supabase Dashboard](https://supabase.com/dashboard/project/fxdlscqifuicpawdzcdg) → **Database** → **Webhooks** (or **Integrations** → **Webhooks**).
2. **Create a new webhook**:
   - **Name:** `waitlist-thank-you-email`
   - **Table:** `public.waitlist`
   - **Events:** ☑ Insert
   - **URL:** `https://thymos-fit.vercel.app/api/waitlist-webhook`  
     (Use your actual Vercel URL if different.)
3. Save.

## 5. Test

1. Go to thymos-fit.vercel.app
2. Enter your email and join the waitlist.
3. Check your inbox for the thank-you email.
4. If using `onboarding@resend.dev`, it may land in spam initially. For production, verify `thymos.fit` in Resend and use `hello@thymos.fit` as the sender (update the `from` in `api/waitlist-webhook.js`).

## Customizing the Email

Edit `api/waitlist-webhook.js` to change the subject, body, or sender.
