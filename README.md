# Shopify Google Maps Address Autocomplete Extension

A Shopify Checkout UI Extension that provides address autocomplete suggestions using Google Maps Places API.

## Features

- ✅ Real-time address autocomplete suggestions
- ✅ Integration with Google Maps Places API
- ✅ Country-specific filtering
- ✅ Auto-population of address fields
- ✅ Support for address1 and zip field autocomplete

## Prerequisites

1. **Shopify CLI** - Install the Shopify CLI:
   ```bash
   npm install -g @shopify/cli @shopify/theme
   ```

2. **Google Maps API Key** - Get your API key from [Google Cloud Console](https://console.cloud.google.com/):
   - Enable the following APIs:
     - Places API
     - Places API (New)
   - Create credentials (API Key)
   - Restrict the API key to only the APIs you need for security

3. **Shopify Partner Account** - You need a Shopify Partner account to develop extensions

## Installation

1. **Clone or navigate to this directory**
   ```bash
   cd autocomplete-new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Link to your Shopify app**
   ```bash
   shopify app link
   ```
   Or create a new app:
   ```bash
   shopify app generate
   ```

## Configuration

### Using .env File (Recommended for Development)

1. **Create a `.env` file** in the root directory:
   ```bash
   cp .env.example .env
   ```

2. **Add your Google Maps API key** to the `.env` file:
   ```env
   GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. **Sync the config** from your .env file:
   ```bash
   npm run sync-config
   ```
   
   This automatically updates `src/config.js` with your API key from the `.env` file.

4. **Start development** - The extension will automatically use your API key:
   ```bash
   npm run dev
   ```
   
   Note: The `predev` script automatically runs `sync-config` before starting dev server.

### Using Extension Settings (Recommended for Production)

1. **Configure via Shopify Partner Dashboard**
   - Go to your Shopify Partner Dashboard
   - Navigate to your app > Extensions
   - Find this extension and add your Google Maps API Key in the settings

2. **Or configure when running dev**
   - When you run `shopify app dev`, you'll be prompted for extension settings
   - Enter your Google Maps API Key when prompted

## Development

1. **Start the development server**
   ```bash
   shopify app dev
   ```

2. **Preview your extension**
   - The CLI will provide a preview link
   - Add items to cart and proceed to checkout
   - Start typing an address to see autocomplete suggestions

## Deployment

1. **Deploy the extension**
   ```bash
   shopify app deploy
   ```

2. **Install on your store**
   - Go to your Shopify admin
   - Navigate to Settings > Checkout
   - Add the extension from the list of available extensions

## Important Notes

### Security Best Practice

⚠️ **Important**: The current implementation uses the API key directly in the frontend. For production use, you should:

1. **Create a backend proxy** - Build an API endpoint on your server that:
   - Accepts the search query
   - Calls Google Maps API with your server-side API key
   - Returns the results to the extension

2. **Update the extension** to call your backend instead:
   ```javascript
   const response = await fetch(
     `https://your-backend.com/api/address-autocomplete?query=${value}&country=${selectedCountryCode}`,
     { 
       signal,
       headers: {
         'Authorization': `Bearer ${await shopify.sessionToken.get()}`
       }
     }
   );
   ```

3. **Restrict your Google Maps API Key**:
   - In Google Cloud Console, restrict the key to specific HTTP referrers
   - Or use IP restrictions if using a backend proxy

## API Limits

- Google Maps Places API has usage limits based on your pricing plan
- The extension limits suggestions to 5 results (as per Shopify's requirement)
- Consider implementing caching for frequently searched addresses

## Extension Structure

```
.
├── shopify.extension.toml    # Extension configuration
├── src/
│   └── index.js              # Main extension code
├── package.json              # Node.js dependencies
└── README.md                 # This file
```

## Troubleshooting

### Extension not showing suggestions
- Verify your Google Maps API key is correct
- Check that Places API is enabled in Google Cloud Console
- Check browser console for errors
- Verify the API key has proper restrictions

### CORS errors
- Google Maps API should handle CORS, but if you see errors, use a backend proxy
- Consider using your own backend API endpoint

### Rate limiting
- Monitor your Google Cloud Console for API usage
- Implement caching to reduce API calls
- Consider upgrading your Google Maps API plan

## Support

For issues related to:
- **Shopify Extension API**: [Shopify Documentation](https://shopify.dev/docs/api/checkout-ui-extensions)
- **Google Maps API**: [Google Maps Documentation](https://developers.google.com/maps/documentation)

## License

MIT

