const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    // If running in browser and NOT on localhost, default to the relative rewrite path
    if (window.location.hostname !== 'localhost') {
      return '/api/backend';
    }
  }
  
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();
