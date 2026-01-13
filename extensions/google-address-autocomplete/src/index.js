/**
 * Shopify Checkout Extension - Google Maps Address Autocomplete
 * 
 * This extension provides address autocomplete suggestions using Google Maps Places API
 */

// Import API key from config (fallback if settings are not available)
// To use env file: Copy your API key from .env to src/config.js
import { GOOGLE_MAPS_API_KEY as API_KEY_FROM_CONFIG } from './config.js';

// Extension initialization log
// console.log('[EXTENSION INIT] Address autocomplete extension loaded');

export default async function extension() {
  // console.log('[EXTENSION RUN] Extension function called');
  
  const { field, value, selectedCountryCode } = shopify.target;
  const { signal } = shopify;
  
  // console.log('[INPUT] Field:', field, '| Value:', value, '| Country:', selectedCountryCode || 'not set');
  
  // Get Google Maps API key from extension settings (preferred) or config file (fallback)
  const apiKey = shopify.settings.current?.google_maps_api_key || API_KEY_FROM_CONFIG;
  
  // console.log('[API KEY] Source:', shopify.settings.current?.google_maps_api_key ? 'extension settings' : 'config file', '| Key present:', !!apiKey);
  
  // If no API key or no input value, return empty suggestions
  if (!apiKey || !value || value.trim().length === 0) {
    if (!apiKey) {
      console.warn('[WARNING] No API key found - returning empty suggestions');
    } else if (!value || value.trim().length === 0) {
      // console.log('[INFO] Empty input value - returning empty suggestions');
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
      // console.log('[API CALL] Using backend proxy:', url.replace(/query=[^&]+/, 'query=***'));
    } else {
      // Use custom proxy server (phpstack-1542664-5964271.cloudwaysapps.com)
      const countryRestriction = selectedCountryCode ? `&components=country:${selectedCountryCode}` : '';
      url = `https://phpstack-1542664-5964271.cloudwaysapps.com/google-proxy/place/autocomplete/json?input=${encodeURIComponent(value)}&key=${apiKey}${countryRestriction}&types=address`;
      useProxy = true;
      // console.log('[API CALL] Using custom proxy server');
      // console.log('[API CALL] Proxy URL:', url.replace(/key=[^&]+/, 'key=***MASKED***'));
    }
    
    // console.log('[API CALL] Making request to Google Maps Places API');
    // console.log('[API CALL] Query:', value, '| Country filter:', selectedCountryCode || 'none');
    
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
    
    // console.log('[API RESPONSE] Status:', response.status, response.statusText, '| Duration:', fetchDuration + 'ms');
    
    if (!response.ok) {
      console.error('[API ERROR] Google Maps API error:', response.status, response.statusText);
      
      // Generate fallback example data when API request fails
      const fallbackData = generateFallbackAddressData(value, selectedCountryCode);
      console.log('[FALLBACK] API request failed - Using example data:');
      console.log(JSON.stringify(fallbackData, null, 2));
      
      return { suggestions: fallbackData.suggestions };
    }
    
    const data = await response.json();
    
    // console.log('[API RESPONSE] Google API status:', data.status);
    // console.log('[API RESPONSE] Predictions count:', data.predictions?.length || 0);
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[API ERROR] Google Maps API status:', data.status, '| Error message:', data.error_message || 'no error message');
      
      // Generate fallback example data when API fails
      const fallbackData = generateFallbackAddressData(value, selectedCountryCode);
      console.log('[FALLBACK] API failed - Using example data:');
      console.log(JSON.stringify(fallbackData, null, 2));
      
      return { suggestions: fallbackData.suggestions };
    }
    
    if (data.status === 'ZERO_RESULTS') {
      // console.log('[API RESPONSE] No results found for query:', value);
      return { suggestions: [] };
    }
    
    // Transform Google Places predictions to Shopify format
    // console.log('[PROCESSING] Processing', data.predictions.length, 'predictions (limiting to 5)');
    
    // Get backend URL for place details (reuse from above scope)
    const backendUrlForDetails = shopify.settings.current?.backend_url || '';
    
    const processStartTime = Date.now();
    const suggestions = await Promise.all(
      data.predictions.slice(0, 5).map(async (prediction, index) => {
        // console.log('[PROCESSING] Processing prediction', index + 1, ':', prediction.description);
        
        // Get place details to extract formatted address
        let detailsUrl;
        if (backendUrlForDetails) {
          // Use backend proxy for place details
          detailsUrl = `${backendUrlForDetails}/api/place-details?place_id=${prediction.place_id}`;
        } else {
          // Use custom proxy for place details
          detailsUrl = `https://phpstack-1542664-5964271.cloudwaysapps.com/google-proxy/place/details/json?place_id=${prediction.place_id}&fields=formatted_address,address_components&key=${apiKey}`;
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
              // console.log('[DETAILS] Place details fetched in', detailsDuration + 'ms for:', prediction.description);
              // console.log('[DETAILS] Parsed address:', formattedAddress);
            } else {
              console.warn('[DETAILS] Failed to get place details:', detailsData.status);
            }
          } else {
            console.warn('[DETAILS] Place details request failed:', detailsResponse.status);
          }
        } catch (error) {
          console.warn('[DETAILS] Error fetching place details:', error.message);
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
        
        // console.log('[SUGGESTION] Created suggestion', index + 1, ':', suggestion.label);
        
        return suggestion;
      })
    );
    
    const processDuration = Date.now() - processStartTime;
    const filteredSuggestions = suggestions.filter(s => s !== null);
    
    // console.log('[RESULT] Returning', filteredSuggestions.length, 'suggestions (processed in', processDuration + 'ms)');
    // console.log('[RESULT] Suggestions:', filteredSuggestions.map(s => s.label));
    
    return {
      suggestions: filteredSuggestions,
    };
    
  } catch (error) {
    // Handle abort signal gracefully
    if (error.name === 'AbortError') {
      // console.log('[ABORT] Request was cancelled (likely due to new input)');
      return { suggestions: [] };
    }
    
    console.error('[ERROR] Address autocomplete error:', error.name, error.message);
    console.error('[ERROR] Stack:', error.stack);
    
    // Generate fallback example data when error occurs
    const fallbackData = generateFallbackAddressData(value, selectedCountryCode);
    console.log('[FALLBACK] Error occurred - Using example data:');
    console.log(JSON.stringify(fallbackData, null, 2));
    
    return { suggestions: fallbackData.suggestions };
  }
}

/**
 * Generate fallback example address data when API fails
 * This provides sample JSON structure for testing/development
 */
function generateFallbackAddressData(query, countryCode) {
  const queryLower = (query || '').toLowerCase().trim();
  
  // Example addresses based on common queries
  const exampleAddresses = [
    {
      id: 'fallback-1',
      label: `123 Main Street, ${countryCode ? getCountryName(countryCode) : 'New York'}, NY 10001`,
      matchedSubstrings: queryLower ? findMatchedSubstrings(`123 Main Street, ${countryCode ? getCountryName(countryCode) : 'New York'}, NY 10001`, queryLower) : [],
      formattedAddress: {
        address1: '123 Main Street',
        address2: '',
        city: countryCode ? getCountryName(countryCode) : 'New York',
        zip: '10001',
        provinceCode: 'NY',
        countryCode: countryCode || 'US',
      },
    },
    {
      id: 'fallback-2',
      label: `456 Oak Avenue, ${countryCode ? getCountryName(countryCode) : 'Los Angeles'}, CA 90001`,
      matchedSubstrings: queryLower ? findMatchedSubstrings(`456 Oak Avenue, ${countryCode ? getCountryName(countryCode) : 'Los Angeles'}, CA 90001`, queryLower) : [],
      formattedAddress: {
        address1: '456 Oak Avenue',
        address2: '',
        city: countryCode ? getCountryName(countryCode) : 'Los Angeles',
        zip: '90001',
        provinceCode: 'CA',
        countryCode: countryCode || 'US',
      },
    },
    {
      id: 'fallback-3',
      label: `789 Park Boulevard, ${countryCode ? getCountryName(countryCode) : 'Chicago'}, IL 60601`,
      matchedSubstrings: queryLower ? findMatchedSubstrings(`789 Park Boulevard, ${countryCode ? getCountryName(countryCode) : 'Chicago'}, IL 60601`, queryLower) : [],
      formattedAddress: {
        address1: '789 Park Boulevard',
        address2: '',
        city: countryCode ? getCountryName(countryCode) : 'Chicago',
        zip: '60601',
        provinceCode: 'IL',
        countryCode: countryCode || 'US',
      },
    },
    {
      id: 'fallback-4',
      label: `321 Elm Street, ${countryCode ? getCountryName(countryCode) : 'Houston'}, TX 77001`,
      matchedSubstrings: queryLower ? findMatchedSubstrings(`321 Elm Street, ${countryCode ? getCountryName(countryCode) : 'Houston'}, TX 77001`, queryLower) : [],
      formattedAddress: {
        address1: '321 Elm Street',
        address2: '',
        city: countryCode ? getCountryName(countryCode) : 'Houston',
        zip: '77001',
        provinceCode: 'TX',
        countryCode: countryCode || 'US',
      },
    },
    {
      id: 'fallback-5',
      label: `555 Pine Road, ${countryCode ? getCountryName(countryCode) : 'Phoenix'}, AZ 85001`,
      matchedSubstrings: queryLower ? findMatchedSubstrings(`555 Pine Road, ${countryCode ? getCountryName(countryCode) : 'Phoenix'}, AZ 85001`, queryLower) : [],
      formattedAddress: {
        address1: '555 Pine Road',
        address2: '',
        city: countryCode ? getCountryName(countryCode) : 'Phoenix',
        zip: '85001',
        provinceCode: 'AZ',
        countryCode: countryCode || 'US',
      },
    },
  ];
  
  // Filter addresses that match the query (if provided)
  let suggestions = exampleAddresses;
  if (queryLower && queryLower.length > 0) {
    suggestions = exampleAddresses.filter(addr => 
      addr.label.toLowerCase().includes(queryLower) ||
      addr.formattedAddress.address1.toLowerCase().includes(queryLower) ||
      addr.formattedAddress.city.toLowerCase().includes(queryLower)
    );
    
    // If no matches, return all examples
    if (suggestions.length === 0) {
      suggestions = exampleAddresses;
    }
  }
  
  return {
    suggestions: suggestions.slice(0, 5),
    metadata: {
      source: 'fallback',
      reason: 'API request failed or returned error',
      query: query,
      countryCode: countryCode,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Find matched substrings in a string (for highlighting)
 */
function findMatchedSubstrings(text, query) {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const matches = [];
  
  let index = textLower.indexOf(queryLower);
  while (index !== -1) {
    matches.push({
      offset: index,
      length: queryLower.length,
    });
    index = textLower.indexOf(queryLower, index + 1);
  }
  
  return matches;
}

/**
 * Get country name from country code (simple mapping)
 */
function getCountryName(countryCode) {
  const countryNames = {
    'US': 'United States',
    'CA': 'Canada',
    'GB': 'United Kingdom',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'PL': 'Poland',
    'IE': 'Ireland',
    'PT': 'Portugal',
    'GR': 'Greece',
    'IN': 'India',
    'JP': 'Japan',
    'CN': 'China',
    'KR': 'South Korea',
    'SG': 'Singapore',
    'MY': 'Malaysia',
    'TH': 'Thailand',
    'PH': 'Philippines',
    'ID': 'Indonesia',
    'VN': 'Vietnam',
    'NZ': 'New Zealand',
    'MX': 'Mexico',
    'BR': 'Brazil',
    'AR': 'Argentina',
    'CL': 'Chile',
    'CO': 'Colombia',
    'PE': 'Peru',
    'ZA': 'South Africa',
    'EG': 'Egypt',
    'AE': 'United Arab Emirates',
    'SA': 'Saudi Arabia',
    'IL': 'Israel',
    'TR': 'Turkey',
    'RU': 'Russia',
  };
  
  return countryNames[countryCode?.toUpperCase()] || countryCode || 'Unknown';
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

