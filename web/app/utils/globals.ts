const getApiBaseUrl = async () => {

  const response = await fetch('/api/server_url');
  const data = await response.json();
  return data.apiBaseUrl;
};

export const API_BASE_URL: string = await getApiBaseUrl();

