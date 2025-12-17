const globals: {
  API_BASE_URL: string;
} = {
  API_BASE_URL: "",
};

const initGlobals = async () => {
  try{
    const response = await fetch('/api/server_url');
    const data = await response.json();
    globals.API_BASE_URL = data.apiBaseUrl;
    console.log('globals', globals);
  } catch (error) {
    // skip build time error. we can't statically define the API_BASE_URL in this file.
  }
};

initGlobals();

export default globals;