# Environment Setup Guide

## Quick Start

1. **Create your `.env` file** (if it doesn't exist):
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env
   
   # Or manually create .env file with:
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. **Add your Google Maps API Key**:
   - Open `.env` file
   - Replace `your_api_key_here` with your actual API key
   - Example: `GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

3. **Sync the config**:
   ```bash
   npm run sync-config
   ```
   
   This reads your `.env` file and updates `src/config.js` automatically.

4. **Start development**:
   ```bash
   npm run dev
   ```
   
   The `predev` hook will automatically sync your config before starting!

## How It Works

The extension checks for API key in this order:
1. **Extension Settings** (from Shopify Partner Dashboard) - **Preferred for production**
2. **Config File** (`src/config.js`) - **Used if settings not available**

The `sync-config` script:
- Reads `GOOGLE_MAPS_API_KEY` from your `.env` file
- Updates `src/config.js` with the value
- Provides feedback if the key is missing or invalid

## Getting Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Places API** (and optionally **Places API (New)**)
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key
6. (Recommended) Restrict the API key:
   - Application restrictions: HTTP referrers
   - Add: `https://checkout.shopify.com/*`
   - API restrictions: Restrict to Places API only

## Troubleshooting

### "API key not found"
- Make sure `.env` file exists in the root directory
- Check that `GOOGLE_MAPS_API_KEY=` line is present
- Verify there are no spaces around the `=` sign

### "Warning: GOOGLE_MAPS_API_KEY not set"
- The `.env` file exists but the key is still `your_api_key_here`
- Replace the placeholder with your actual API key

### Extension not working
- Run `npm run sync-config` to update the config
- Check browser console for errors
- Verify your API key is valid and has Places API enabled

## Security Notes

⚠️ **Important**: 
- The `.env` file is gitignored (not committed to version control)
- `src/config.js` may contain your API key - consider adding it to `.gitignore` if you want
- For production, use extension settings instead of config file
- Never commit API keys to version control



