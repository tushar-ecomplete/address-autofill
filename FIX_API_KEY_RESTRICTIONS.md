# Fix API Key Referrer Restrictions

## Error: RefererNotAllowedMapError

This error occurs when your Google Maps API key has HTTP referrer restrictions and `localhost:8000` is not in the allowed list.

## Solution: Add Localhost to Allowed Referrers

### Step 1: Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your API key (the one you're using: starts with `AIzaSy...`)
5. Click on the API key name to edit it

### Step 2: Add Referrer Restrictions

1. Scroll down to **Application restrictions**
2. Select **HTTP referrers (websites)**
3. Click **Add an item**
4. Add these referrers for local testing:

```
http://localhost:8000/*
http://localhost:8000/test-google-autocomplete.html
http://127.0.0.1:8000/*
http://127.0.0.1:8000/test-google-autocomplete.html
localhost:8000/*
127.0.0.1:8000/*
```

5. If you want to test on any port, you can also add:
```
http://localhost:*/*
http://127.0.0.1:*/*
```

6. For production/Shopify, make sure these are also included:
```
https://checkout.shopify.com/*
https://*.myshopify.com/*
https://extensions.shopifycdn.com/*
```

### Step 3: Save Changes

1. Click **Save** at the bottom
2. Wait 1-2 minutes for changes to propagate
3. Refresh your test page and try again

## Alternative: Create a Separate Test API Key

If you don't want to modify your production API key restrictions:

### Option A: Create Unrestricted Test Key (Development Only)

1. In Google Cloud Console → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API Key**
3. Click on the newly created key
4. Under **Application restrictions**, select **None** (⚠️ For testing only!)
5. Under **API restrictions**, select **Restrict key**
6. Select only **Places API** and **Maps JavaScript API**
7. Save and use this key in your HTML test file

### Option B: Separate Key for Localhost Only

1. Create a new API key
2. Set **Application restrictions** to **HTTP referrers**
3. Add only localhost referrers (for security)
4. Use this key only for local testing

## Update Test File with New Key (if needed)

If you created a separate test key, update `test-google-autocomplete.html`:

Find this line (around line 246):
```javascript
API_KEY = 'AIzaSyBxGNrkrNd_-kLAfHvUl4X9AD9pF-lmFts';
```

Replace with your test API key:
```javascript
API_KEY = 'YOUR_TEST_API_KEY_HERE';
```

## Verify It's Working

After updating the referrers:
1. Wait 1-2 minutes for propagation
2. Refresh the test page
3. The error should be gone
4. You should see "✅ Ready! Start typing an address..." message

## Important Notes

⚠️ **Security**: 
- Never commit API keys to git
- Use environment variables in production
- Restrict API keys appropriately
- Use separate keys for dev/prod

✅ **Best Practice**:
- Keep production key restrictions strict
- Use separate test key with localhost only
- Regularly rotate API keys



