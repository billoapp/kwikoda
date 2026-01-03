# Vercel Dashboard Checklist

## Step 1: Access Your Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Find your project: `tabz-kikao` or similar
3. Click on the project
4. Go to **Settings** → **Environment Variables**

## Step 2: Check Required Variables
Look for these exact variable names and verify their values:

### ✅ NEXT_PUBLIC_SUPABASE_URL
- **Expected**: `https://bkaigyrrzsqbfscyznzw.supabase.co`
- **Environment**: Production, Preview, Development (all checked)

### ✅ SUPABASE_SECRET_KEY  
- **Expected**: `sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYpLG`
- **Environment**: Production, Preview, Development (all checked)
- **⚠️ CRITICAL**: Must be exactly this value, no extra spaces/quotes

### ✅ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- **Expected**: `sb_publishable_sS8TJmpBNLw5fAHNfTb9og_EurMoc49`
- **Environment**: Production, Preview, Development (all checked)

## Step 3: Common Issues to Check

### Issue 1: Wrong Variable Names
❌ `SUPABASE_KEY` instead of `SUPABASE_SECRET_KEY`
❌ `SUPABASE_SERVICE_KEY` instead of `SUPABASE_SECRET_KEY`
❌ `NEXT_PUBLIC_SUPABASE_KEY` instead of `SUPABASE_SECRET_KEY`

### Issue 2: Wrong Environment Scope
❌ Variable only set for "Development" or "Preview"
✅ Must be set for "Production"

### Issue 3: Value Issues
❌ Extra quotes: `"sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYpLG"`
❌ Extra spaces: ` sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYpLG `
❌ Truncated: `sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYp`
✅ Exact: `sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYpLG`

### Issue 4: Legacy Keys
❌ Using old JWT format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
✅ Using new format: `sb_secret_...`

## Step 4: If You Find Issues
1. **Delete** the incorrect variable
2. **Add** the correct variable with exact value
3. **Redeploy** your application
4. **Test** with our diagnostic script

## Step 5: Vercel CLI Alternative
If you have Vercel CLI installed:
```bash
# List all environment variables
vercel env ls

# Check specific variable
vercel env ls | grep SUPABASE_SECRET_KEY
```

## What to Report Back
Please check and let me know:
1. ✅/❌ Do all three variables exist?
2. ✅/❌ Are they set for "Production" environment?
3. ✅/❌ Do the values match exactly (especially SUPABASE_SECRET_KEY)?
4. 🔍 Any differences you notice?