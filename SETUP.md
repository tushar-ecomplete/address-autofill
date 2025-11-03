# Quick Setup Guide

## Step 1: Install Shopify CLI

```bash
npm install -g @shopify/cli @shopify/theme
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Link to Your Shopify App

If you already have a Shopify app:

```bash
shopify app link
```

If you need to create a new app:

```bash
shopify app generate
```

## Step 4: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API**
   - **Places API (New)** (if available)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key
6. (Recommended) Restrict the API key:
   - Application restrictions: HTTP referrers
   - Add: `https://checkout.shopify.com/*`
   - API restrictions: Restrict to Places API only

## Step 5: Configure Extension Settings

### Option A: Via Shopify Partner Dashboard

1. Go to your [Shopify Partner Dashboard](https://partners.shopify.com/)
2. Navigate to your app
3. Go to "Extensions"
4. Find "google-address-autocomplete"
5. Click "Configure"
6. Enter your Google Maps API Key
7. Save

### Option B: Via CLI (Development)

The extension settings will be available when you run `shopify app dev`

## Step 6: Run Development Server

```bash
shopify app dev
```

This will:
- Start a development server
- Provide a preview link
- Watch for file changes

## Step 7: Test the Extension

1. Use the preview link from Step 6
2. Add a product to cart
3. Go to checkout
4. Start typing in the address field
5. You should see Google Maps autocomplete suggestions

## Step 8: Deploy to Production

```bash
shopify app deploy
```

Then install the extension in your store:
1. Go to Shopify Admin → Settings → Checkout
2. Find your extension in the list
3. Click "Enable"

## Troubleshooting

### "Extension not found"
- Make sure you've linked the app: `shopify app link`
- Check that the extension is in your app's extension list

### "API key invalid"
- Verify your Google Maps API key is correct
- Ensure Places API is enabled
- Check API key restrictions

### "No suggestions appearing"
- Check browser console for errors
- Verify API key is set in extension settings
- Ensure you have API quota remaining in Google Cloud Console

## Next Steps

For production use, consider implementing a backend proxy to keep your API key secure. See the README.md for details.


