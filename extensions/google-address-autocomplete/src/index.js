/**
 * Shopify Checkout Extension - Google Maps Address Autocomplete
 * 
 * This extension provides address autocomplete suggestions using Google Maps Places API
 */

// Import API key from config (fallback if settings are not available)
// To use env file: Copy your API key from .env to src/config.js
import { GOOGLE_MAPS_API_KEY as API_KEY_FROM_CONFIG } from './config.js';

// Extension initialization log
console.log('TUSHAR-31-10: [EXTENSION INIT] Address autocomplete extension loaded');

export default async function extension() {
  console.log('TUSHAR-31-10: [EXTENSION RUN] Extension function called');
  
  const { field, value, selectedCountryCode } = shopify.target;
  const { signal } = shopify;
  
  console.log('TUSHAR-31-10: [INPUT] Field:', field, '| Value:', value, '| Country:', selectedCountryCode || 'not set');
  
  // Get Google Maps API key from extension settings (preferred) or config file (fallback)
  const apiKey = shopify.settings.current?.google_maps_api_key || API_KEY_FROM_CONFIG;
  
  console.log('TUSHAR-31-10: [API KEY] Source:', shopify.settings.current?.google_maps_api_key ? 'extension settings' : 'config file', '| Key present:', !!apiKey);
  
  // If no API key or no input value, return empty suggestions
  if (!apiKey || !value || value.trim().length === 0) {
    if (!apiKey) {
      console.warn('TUSHAR-31-10: [WARNING] No API key found - returning empty suggestions');
    } else if (!value || value.trim().length === 0) {
      console.log('TUSHAR-31-10: [INFO] Empty input value - returning empty suggestions');
    }
    return { suggestions: [] };
  }

  try {
    // Use Google Places Autocomplete API through CORS proxy to avoid CORS issues
    // For production, use a backend proxy configured in extension settings
    const backendUrl = shopify.settings.current?.backend_url || '';
    
    let url;
    let useProxy = false;
    
    if (backendUrl) {
      // Use configured backend proxy (recommended for production)
      const countryParam = selectedCountryCode ? `&country=${selectedCountryCode}` : '';
      url = `${backendUrl}/api/address-autocomplete?query=${encodeURIComponent(value)}${countryParam}`;
      console.log('TUSHAR-31-10: [API CALL] Using backend proxy:', url.replace(/query=[^&]+/, 'query=***'));
    } else {
      // Use CORS proxy as temporary solution (for development/testing)
      // WARNING: Not recommended for production - use a proper backend
      const countryRestriction = selectedCountryCode ? `&components=country:${selectedCountryCode}` : '';
      const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(value)}&key=${apiKey}${countryRestriction}&types=address`;
      // Using corsproxy.io as temporary CORS proxy
      url = `https://corsproxy.io/?${encodeURIComponent(googleUrl)}`;
      useProxy = true;
      console.log('TUSHAR-31-10: [API CALL] Using CORS proxy (temporary solution)');
      console.warn('TUSHAR-31-10: [WARNING] Using CORS proxy - configure backend_url in settings for production');
    }
    
    console.log('TUSHAR-31-10: [API CALL] Making request to Google Maps Places API');
    console.log('TUSHAR-31-10: [API CALL] Query:', value, '| Country filter:', selectedCountryCode || 'none');
    
    const fetchStartTime = Date.now();
    const fetchOptions = {
      signal,
      ...(backendUrl && {
        headers: {
          'Content-Type': 'application/json',
        }
      })
    };
    const response = await fetch(url, fetchOptions);
    const fetchDuration = Date.now() - fetchStartTime;
    
    console.log('TUSHAR-31-10: [API RESPONSE] Status:', response.status, response.statusText, '| Duration:', fetchDuration + 'ms');
    
    if (!response.ok) {
      console.error('TUSHAR-31-10: [API ERROR] Google Maps API error:', response.status, response.statusText);
      return { suggestions: [] };
    }
    
    const data = await response.json();
    
    console.log('TUSHAR-31-10: [API RESPONSE] Google API status:', data.status);
    console.log('TUSHAR-31-10: [API RESPONSE] Predictions count:', data.predictions?.length || 0);
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('TUSHAR-31-10: [API ERROR] Google Maps API status:', data.status, '| Error message:', data.error_message || 'no error message');
      return { suggestions: [] };
    }
    
    if (data.status === 'ZERO_RESULTS') {
      console.log('TUSHAR-31-10: [API RESPONSE] No results found for query:', value);
      return { suggestions: [] };
    }
    
    // Transform Google Places predictions to Shopify format
    console.log('TUSHAR-31-10: [PROCESSING] Processing', data.predictions.length, 'predictions (limiting to 5)');
    
    // Get backend URL for place details (reuse from above scope)
    const backendUrlForDetails = shopify.settings.current?.backend_url || '';
    
    const processStartTime = Date.now();
    const suggestions = await Promise.all(
      data.predictions.slice(0, 5).map(async (prediction, index) => {
        console.log('TUSHAR-31-10: [PROCESSING] Processing prediction', index + 1, ':', prediction.description);
        
        // Get place details to extract formatted address
        let detailsUrl;
        if (backendUrlForDetails) {
          // Use backend proxy for place details
          detailsUrl = `${backendUrlForDetails}/api/place-details?place_id=${prediction.place_id}`;
        } else {
          // Use CORS proxy for place details (temporary)
          const googleDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=formatted_address,address_components&key=${apiKey}`;
          detailsUrl = `https://corsproxy.io/?${encodeURIComponent(googleDetailsUrl)}`;
        }
        
        let formattedAddress = null;
        try {
          const detailsStartTime = Date.now();
          const detailsResponse = await fetch(detailsUrl, { signal });
          const detailsDuration = Date.now() - detailsStartTime;
          
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            if (detailsData.status === 'OK' && detailsData.result) {
              formattedAddress = parseAddressComponents(detailsData.result.address_components);
              console.log('TUSHAR-31-10: [DETAILS] Place details fetched in', detailsDuration + 'ms for:', prediction.description);
              console.log('TUSHAR-31-10: [DETAILS] Parsed address:', formattedAddress);
            } else {
              console.warn('TUSHAR-31-10: [DETAILS] Failed to get place details:', detailsData.status);
            }
          } else {
            console.warn('TUSHAR-31-10: [DETAILS] Place details request failed:', detailsResponse.status);
          }
        } catch (error) {
          console.warn('TUSHAR-31-10: [DETAILS] Error fetching place details:', error.message);
        }
        
        // Extract matched substrings for highlighting
        const matchedSubstrings = prediction.matched_substrings || [];
        
        const suggestion = {
          id: prediction.place_id || `suggestion-${index}`,
          label: prediction.description,
          matchedSubstrings: matchedSubstrings.map(m => ({
            offset: m.offset,
            length: m.length,
          })),
          formattedAddress: formattedAddress,
        };
        
        console.log('TUSHAR-31-10: [SUGGESTION] Created suggestion', index + 1, ':', suggestion.label);
        
        return suggestion;
      })
    );
    
    const processDuration = Date.now() - processStartTime;
    const filteredSuggestions = suggestions.filter(s => s !== null);
    
    console.log('TUSHAR-31-10: [RESULT] Returning', filteredSuggestions.length, 'suggestions (processed in', processDuration + 'ms)');
    console.log('TUSHAR-31-10: [RESULT] Suggestions:', filteredSuggestions.map(s => s.label));
    
    return {
      suggestions: filteredSuggestions,
    };
    
  } catch (error) {
    // Handle abort signal gracefully
    if (error.name === 'AbortError') {
      console.log('TUSHAR-31-10: [ABORT] Request was cancelled (likely due to new input)');
      return { suggestions: [] };
    }
    
    console.error('TUSHAR-31-10: [ERROR] Address autocomplete error:', error.name, error.message);
    console.error('TUSHAR-31-10: [ERROR] Stack:', error.stack);
    return { suggestions: [] };
  }
}

/**
 * Parse Google Maps address components into Shopify address format
 */
function parseAddressComponents(components) {
  const address = {
    address1: '',
    address2: '',
    city: '',
    zip: '',
    provinceCode: '',
    countryCode: '',
  };
  
  if (!components || !Array.isArray(components)) {
    return null;
  }
  
  components.forEach(component => {
    const types = component.types;
    
    if (types.includes('street_number')) {
      address.address1 = component.long_name + ' ';
    }
    
    if (types.includes('route')) {
      address.address1 = (address.address1 + component.long_name).trim();
    }
    
    if (types.includes('subpremise') || types.includes('premise')) {
      address.address2 = component.long_name;
    }
    
    if (types.includes('locality')) {
      address.city = component.long_name;
    } else if (types.includes('administrative_area_level_1') && !address.city) {
      // Fallback to administrative area if no locality
      address.city = component.long_name;
    }
    
    if (types.includes('postal_code')) {
      address.zip = component.long_name;
    }
    
    if (types.includes('administrative_area_level_1')) {
      // Get short name for province/state code
      address.provinceCode = component.short_name;
    }
    
    if (types.includes('country')) {
      address.countryCode = component.short_name;
    }
  });
  
  return address;
}

