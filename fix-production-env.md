# Production Environment Variable Fix

## Issue Identified
❌ **"Invalid Compact JWS"** error indicates the `SUPABASE_SECRET_KEY` in production is invalid.

## Root Cause
You're using Supabase's **NEW secret key format** (`sb_secret_...`) locally, but production likely has:
1. The old legacy service role key format (`eyJ...`)
2. Missing or truncated new secret key
3. Wrong key type (publishable instead of secret)

## Solution Steps

### 1. Check Your Local Working Key
Your local `.env.local` has the NEW format:
```
SUPABASE_SECRET_KEY="sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYpLG"
```

### 2. Verify Key Format
✅ **NEW secret key format**: `sb_secret_...` (Supabase's recommended format)
❌ **Legacy service role format**: `eyJ...` (deprecated JWT token)
❌ **Publishable key format**: `sb_publishable_...` (wrong type)

### 3. Get the Correct NEW Secret Key
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `bkaigyrrzsqbfscyznzw`
3. Go to Settings → API
4. Under "**New secret key**" section, copy the key starting with `sb_secret_...`
5. **NOT** the legacy service_role key

### 4. Update Production Environment
Update your Vercel production environment variables with the NEW secret key:

```bash
# In Vercel dashboard or CLI
SUPABASE_SECRET_KEY=sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYpLG
```

**Important**: Use the same NEW secret key format that works locally (`sb_secret_...`), not the legacy JWT format.

### 5. Redeploy
After updating the environment variable, redeploy your application.

## Quick Fix Command
If you have Vercel CLI installed:
```bash
vercel env add SUPABASE_SECRET_KEY production
# Paste the NEW secret key (sb_secret_...) when prompted
vercel --prod
```

## Alternative: Vercel Dashboard
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Find `SUPABASE_SECRET_KEY` 
5. Update it with the NEW secret key format: `sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYpLG`
6. Redeploy

## Verification
After fixing, test again with:
```bash
node diagnose-production-issue.js
```

The error should change from "Invalid Compact JWS" to a successful upload or a different, more specific error.