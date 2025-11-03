# Guide: Switching to levis-sa-development.myshopify.com

## Error: "Could not find store for domain"

This error typically occurs when:
1. The store is not a development store
2. The app is not installed on the target store
3. The store is not accessible to your Shopify Partner account
4. Store name format is incorrect

## Solution Steps

### Step 1: Verify Store Type
The store `levis-sa-development.myshopify.com` must be:
- A **Development Store** OR
- A **Shopify Plus Sandbox Store**

Regular production stores cannot be used with `shopify app dev`.

### Step 2: Install App on Target Store
Before using the store with `shopify app dev`, the app must be installed:

1. Go to `https://levis-sa-development.myshopify.com/admin`
2. Navigate to **Apps** → **App and sales channel settings**
3. Find "autocomplete-new" or install it using your app's Client ID: `0de41aad723709192626c354b7e4533a`

### Step 3: Verify Store Access
Ensure the store appears in your Shopify Partner Dashboard:
1. Go to https://partners.shopify.com/
2. Check if `levis-sa-development` appears in your stores list

### Step 4: Try Different Store Name Formats
Try these variations:

```bash
# Option 1: Full domain
shopify app dev --store levis-sa-development.myshopify.com

# Option 2: Just the subdomain (if supported)
shopify app dev --store levis-sa-development

# Option 3: Using short flag
shopify app dev -s levis-sa-development.myshopify.com
```

### Step 5: Re-authenticate CLI
If still not working, re-authenticate:

```bash
shopify logout
shopify login
```

Then try again.

### Step 6: Use Config Link (Alternative)
Instead of using `--store` flag, try:

```bash
shopify app config link --reset
```

Then when prompted, select `levis-sa-development.myshopify.com` from the list.

## Important Notes

- The `--store` flag only works for **Development Stores** or **Plus Sandbox Stores**
- Production stores cannot be used with `shopify app dev`
- The app must be installed on the target store before it can be used
- Ensure your Shopify Partner account has access to the store

## Check if Store is Development Store

To verify if a store is a development store:
1. Log into the store admin
2. Check the URL or store settings - development stores typically show "Development Store" in the admin

If the store is NOT a development store, you'll need to:
- Create a new development store, OR
- Convert it to a development store (if you have permissions)



