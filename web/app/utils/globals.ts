const globals: {
  API_BASE_URL: string;
} = {
  API_BASE_URL: "",
};

export const initGlobals = async () => {
  try{
    if (typeof window !== 'undefined') {
      // read header meta tag <meta name="API_BASE_URL" content="https://blog.hollway.fun/api">
      const metaTag = document.querySelector('meta[name="API_BASE_URL"]');
      if (metaTag) {
        globals.API_BASE_URL = metaTag.getAttribute('content') || "";
      }
    } else {
      // const response = await fetch('/api/server_url');
      // const data = await response.json();
      // globals.API_BASE_URL = data.apiBaseUrl;
      // console.log('globals', globals);
    }
  } catch (error) {
    // skip build time error. we can't statically define the API_BASE_URL in this file.
  }
};

initGlobals();

export default globals;

export type Theme = "light" | "dark";