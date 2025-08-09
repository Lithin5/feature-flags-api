// Test script to demonstrate client-side feature flag usage
// This simulates how a client application would request feature flags

const API_BASE_URL = 'http://localhost:3000'; // Update this to your API URL

async function getFeatureFlags(platformKey, environmentKey, scopeSlug, clientId = 'test-client') {
  const url = `${API_BASE_URL}/feature-flags/${environmentKey}/${platformKey}/${scopeSlug}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const flags = await response.json();
    console.log('Feature flags received:', flags);
    return flags;
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    throw error;
  }
}

// Example usage
async function testFeatureFlags() {
  console.log('Testing feature flag retrieval...');
  
  // Replace these with actual values from your database
  const platformKey = 'web';
  const environmentKey = 'production';
  const scopeSlug = 'user-experience';
  
  try {
    const flags = await getFeatureFlags(platformKey, environmentKey, scopeSlug);
    
    // Example of how to use the flags in your application
    if (flags['new-ui-feature']) {
      console.log('New UI feature is enabled!');
    } else {
      console.log('New UI feature is disabled.');
    }
    
    if (flags['beta-feature']) {
      console.log('Beta feature is enabled!');
    } else {
      console.log('Beta feature is disabled.');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testFeatureFlags();
