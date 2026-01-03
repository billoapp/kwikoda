# Vercel Environment Variable Fix

## Issue Identified
Your `vercel.json` maps environment variables, but there might be a mismatch between:
- Local variable names
- Vercel dashboard variable names  
- The mapping in `vercel.json`

## Current Mapping in vercel.json
```json
"env": {
  "SUPABASE_SECRET_KEY": "SUPABASE_SECRET_KEY"
}
```

## Potential Issues

### 1. Variable Name Mismatch
Your local `.env.local` uses: `SUPABASE_SECRET_KEY`
But Vercel dashboard might have it named differently.

### 2. Vercel Dashboard Check
Go to: https://vercel.com/your-team/tabz-kikao/settings/environment-variables

Verify you have:
- ✅ `SUPABASE_SECRET_KEY` = `sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYpLG`
- ✅ `NEXT_PUBLIC_SUPABASE_URL` = `https://bkaigyrrzsqbfscyznzw.supabase.co`

### 3. Quick Fix Options

#### Option A: Remove vercel.json mapping
Remove the env mapping and let Vercel use dashboard variables directly:
```json
{
  "name": "Tabeza-staff",
  "buildCommand": "pnpm --filter staff run build",
  "outputDirectory": ".next", 
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "regions": ["cdg1"]
}
```

#### Option B: Fix the mapping
If dashboard variable is named differently, update mapping:
```json
"env": {
  "SUPABASE_SECRET_KEY": "YOUR_ACTUAL_DASHBOARD_VARIABLE_NAME"
}
```

## Recommended Steps

1. **Check Vercel Dashboard** - Verify exact variable names
2. **Try Option A** - Remove env mapping temporarily  
3. **Redeploy** - `vercel --prod`
4. **Test** - Run our diagnostic script again

## Alternative: Direct Environment Test
Add this to your API route temporarily to debug:
```javascript
console.log('🔍 Env Debug:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.SUPABASE_SECRET_KEY,
  keyPrefix: process.env.SUPABASE_SECRET_KEY?.substring(0, 10),
  keyLength: process.env.SUPABASE_SECRET_KEY?.length
});
```