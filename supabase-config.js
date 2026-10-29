// Supabase configuration for web platform
// This helps resolve CORS and JSON decoding issues

window.supabaseConfig = {
  // Enable debug mode for development
  debug: true,
  
  // Configure fetch options for better compatibility
  fetchOptions: {
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  },
  
  // Configure auth options
  authOptions: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
};

// Override fetch to handle JSON decoding issues ONLY for Supabase requests
if (window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = async function(url, options = {}) {
    // Only modify Supabase requests, let Flutter's fetch work normally
    const isSupabaseRequest = typeof url === 'string' && url.includes('supabase.co');
    
    if (!isSupabaseRequest) {
      // For non-Supabase requests (like Flutter CanvasKit), use original fetch
      return originalFetch(url, options);
    }
    
    try {
      // For Supabase requests, add our custom handling
      const response = await originalFetch(url, {
        ...options,
        mode: options.mode || 'cors',
        credentials: options.credentials || 'same-origin',
      });
      
      // Handle JSON parsing errors for Supabase responses
      if (response.headers.get('content-type')?.includes('application/json')) {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          return new Response(JSON.stringify(json), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        } catch (parseError) {
          console.error('JSON parse error from Supabase:', parseError);
          console.error('Response text:', text);
          throw new Error('Invalid JSON response from Supabase');
        }
      }
      
      return response;
    } catch (error) {
      console.error('Supabase fetch error:', error);
      throw error;
    }
  };
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Check if it's a JSON parsing error
  if (event.reason && event.reason.toString().includes('JSON')) {
    console.error('JSON parsing error detected');
    // Optionally show user-friendly error
    if (window.showNotification) {
      window.showNotification('Authentication error. Please refresh the page and try again.');
    }
  }
});

// Handle Supabase auth state changes
window.addEventListener('supabase:auth:stateChange', function(event) {
  console.log('Supabase auth state changed:', event.detail);
});

console.log('Supabase web configuration loaded');
