# Backend Proxy Setup for Google Maps API

## CORS Issue

The Google Maps API blocks direct requests from browser extensions due to CORS policy. You need a backend proxy.

## Quick Solution: Use CORS Proxy (Development Only)

For quick testing, you can temporarily use a CORS proxy service. **Note: This is NOT recommended for production.**

Update the extension to use a CORS proxy:
- Service: `https://cors-anywhere.herokuapp.com/` (may have limitations)
- Or use: `https://api.allorigins.win/raw?url=`

## Proper Solution: Create Backend API

You need to create a backend endpoint that:
1. Receives the address query from your extension
2. Calls Google Maps API server-side (no CORS issues)
3. Returns the results to your extension

### Option 1: Shopify Functions (Recommended)

Create a Shopify Function to handle the proxy:

```bash
shopify app generate function
# Select: HTTP
# Name: google-maps-proxy
```

### Option 2: External Backend API

If you have a backend server (Node.js, Python, etc.), create an endpoint:

```
GET /api/address-autocomplete?query=...&country=...
```

That calls Google Maps API and returns results.

Then update the extension to call your backend instead of Google Maps directly.



