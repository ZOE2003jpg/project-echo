// Configure base API URL
const getBaseURL = (): string => {
  // Check if we have an env variable (for production)
  if (typeof import.meta !== "undefined" && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Same-origin proxy to https://pitchcapital.ng/api — the live API returns a
  // duplicated CORS header that browsers reject, so calls go through our server.
  if (typeof window !== "undefined") return "/api/public/pc";

  return "https://pitchcapital.ng/api";
};

const API_BASE = getBaseURL();


// Helper function to handle API requests
export async function apiRequest<T>(
  endpoint: string,
  options: Omit<RequestInit, "body"> & { body?: any } = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  // Get auth token from localStorage if available
  const token = typeof window !== "undefined" 
    ? localStorage.getItem("pc_admin_session_token") 
    : null;
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If we're sending JSON, set content-type
  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  // Note: no `credentials: "include"` — the API replies with a wildcard CORS
  // origin, and browsers block credentialed requests against that. Auth rides
  // on the Bearer token above.
  let response: Response;
  try {
    response = await fetch(url, { ...options, headers } as RequestInit);
  } catch {
    throw new Error("Cannot reach the Pitch Capital server. Please check your connection and try again.");
  }


  // Try to parse JSON even if response is error
  let data: T;
  try {
    data = await response.json();
  } catch (e) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Sign-in isn't available in the preview. Please use the published site.");
    }
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }


  if (!response.ok) {
    const raw = (data as any)?.error as string | undefined;
    const friendly: Record<string, string> = {
      ADMIN_NOT_FOUND: "No account found with that email address.",
      INVALID_CREDENTIALS: "Incorrect email or password.",
      INVALID_PASSWORD: "Incorrect email or password.",
      UNAUTHORIZED: "Your session has expired. Please sign in again.",
    };
    throw new Error((raw && friendly[raw]) || raw || `Request failed: ${response.status}`);
  }


  return data;
}
