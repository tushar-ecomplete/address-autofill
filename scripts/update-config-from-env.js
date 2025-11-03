/**
 * Script to update src/config.js from .env file
 * 
 * This script reads your .env file and updates the config.js file
 * so the extension can use your API key during development
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

try {
  // Read .env file
  const envPath = join(rootDir, '.env');
  
  if (!existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log('📄 Please create a .env file with your GOOGLE_MAPS_API_KEY');
    process.exit(1);
  }
  
  const envContent = readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  let apiKey = '';
  for (const line of lines) {
    if (line.trim().startsWith('GOOGLE_MAPS_API_KEY=')) {
      apiKey = line.split('=')[1].trim();
      // Remove quotes if present
      apiKey = apiKey.replace(/^["']|["']$/g, '');
      break;
    }
  }
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('⚠️  Warning: GOOGLE_MAPS_API_KEY not set or is placeholder in .env file');
    console.log('Please set your Google Maps API key in the .env file:');
    console.log('GOOGLE_MAPS_API_KEY=your_actual_api_key_here');
    process.exit(1);
  }
  
  // Update config.js file
  const configPath = join(rootDir, 'src', 'config.js');
  const configContent = `/**
 * Configuration file for Google Maps API Key
 * 
 * IMPORTANT: This file is used as a fallback if extension settings are not configured
 * 
 * This file is auto-generated from .env file by running: npm run sync-config
 * 
 * NOTE: In production, always use extension settings in Shopify Partner Dashboard
 * instead of hardcoding the API key here.
 */

export const GOOGLE_MAPS_API_KEY = '${apiKey}';
`;
  
  writeFileSync(configPath, configContent, 'utf-8');
  
  console.log('✅ Successfully updated src/config.js from .env file');
  console.log(`📝 API key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log('\n💡 The extension will now use this API key if extension settings are not configured');
  console.log('🚀 Run "npm run dev" or "shopify app dev" to test the extension');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}


