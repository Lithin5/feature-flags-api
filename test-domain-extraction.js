// Test script for domain extraction
function extractDomain(urlOrDomain) {
  if (!urlOrDomain || !urlOrDomain.trim()) return '';
  
  let domain = urlOrDomain.trim();
  
  // Remove protocol (http:// or https://) if present
  domain = domain.replace(/^https?:\/\//, '');
  
  // Remove path and query parameters if present
  domain = domain.split('/')[0];
  
  return domain;
}

function validateDomain(domain) {
  if (!domain || !domain.trim()) return false;
  
  const extractedDomain = extractDomain(domain);
  
  // Don't allow localhost or IP addresses
  if (extractedDomain === 'localhost') return false;
  if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(extractedDomain)) return false;
  
  // Must contain a dot
  if (!extractedDomain.includes('.')) return false;
  
  // Check for valid domain format - must be alphanumeric with hyphens and dots
  const domainRegex = /^\.?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(extractedDomain)) return false;
  
  // Don't allow domains with consecutive dots or ending with dot
  if (extractedDomain.includes('..') || extractedDomain.endsWith('.')) return false;
  
  return true;
}

// Test cases
const testCases = [
  'https://feature-flags-ui-sigma.vercel.app',
  'http://feature-flags-ui-sigma.vercel.app',
  'feature-flags-ui-sigma.vercel.app',
  'https://feature-flags-ui-sigma.vercel.app/path/to/page',
  'https://feature-flags-ui-sigma.vercel.app?param=value',
  'localhost',
  '127.0.0.1',
  'example.com',
  '.example.com',
  'app.example.com'
];

console.log('Testing domain extraction and validation:');
console.log('');

testCases.forEach(testCase => {
  const extracted = extractDomain(testCase);
  const isValid = validateDomain(testCase);
  
  console.log(`Input: "${testCase}"`);
  console.log(`Extracted: "${extracted}"`);
  console.log(`Valid: ${isValid ? '✅' : '❌'}`);
  console.log('');
});

console.log('For your case:');
console.log('Current COOKIE_DOMAIN:', process.env.COOKIE_DOMAIN || '(not set)');
if (process.env.COOKIE_DOMAIN) {
  const extracted = extractDomain(process.env.COOKIE_DOMAIN);
  console.log('Extracted domain:', extracted);
  console.log('Should be set to:', extracted.startsWith('.') ? extracted : `.${extracted}`);
}

