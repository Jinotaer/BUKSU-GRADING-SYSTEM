import { API_QUERY_STALE_TIME, queryClient } from "./queryClient";

const API_CACHE_KEY_ROOT = "api-cache";

const cloneCachedBody = (body) => {
  if (body == null) {
    return body;
  }

  if (typeof structuredClone === "function") {
    return structuredClone(body);
  }

  return JSON.parse(JSON.stringify(body));
};

const resolveRequestUrl = (url) => {
  try {
    return new URL(url, window.location.origin).toString();
  } catch (error) {
    return String(url);
  }
};

const getActiveAuthScope = () => {
  if (typeof window === "undefined") {
    return "anonymous";
  }

  try {
    const sessionToken =
      window.sessionStorage?.getItem("accessToken") ||
      window.sessionStorage?.getItem("sessionToken") ||
      "";
    const adminToken = window.localStorage?.getItem("admin_access_token") || "";
    const userType = window.sessionStorage?.getItem("userType") || "anonymous";
    const token = adminToken || sessionToken;

    if (!token) {
      return userType;
    }

    return `${userType}:${token.slice(0, 16)}`;
  } catch (error) {
    return "anonymous";
  }
};

const createCachedResponse = (cachedPayload) => ({
  ok: cachedPayload.ok,
  status: cachedPayload.status,
  statusText: cachedPayload.statusText || "",
  url: cachedPayload.url || "",
  headers: new Headers(cachedPayload.headers || {}),
  redirected: false,
  fromCache: true,
  json: async () => {
    if (!cachedPayload.isJson) {
      throw new Error("Cached response body is not JSON");
    }

    return cloneCachedBody(cachedPayload.body);
  },
  text: async () =>
    cachedPayload.isJson
      ? JSON.stringify(cloneCachedBody(cachedPayload.body))
      : String(cachedPayload.body ?? ""),
});

export const getApiCacheKey = (url) => [
  API_CACHE_KEY_ROOT,
  getActiveAuthScope(),
  resolveRequestUrl(url),
];

export const getFreshCachedResponse = (url) => {
  const queryKey = getApiCacheKey(url);
  const queryState = queryClient.getQueryState(queryKey);

  if (
    !queryState?.data ||
    queryState.isInvalidated ||
    Date.now() - queryState.dataUpdatedAt > API_QUERY_STALE_TIME
  ) {
    return null;
  }

  return createCachedResponse(queryState.data);
};

export const getFreshCachedJson = (url) => {
  const queryKey = getApiCacheKey(url);
  const queryState = queryClient.getQueryState(queryKey);

  if (
    !queryState?.data ||
    queryState.isInvalidated ||
    Date.now() - queryState.dataUpdatedAt > API_QUERY_STALE_TIME ||
    !queryState.data.isJson
  ) {
    return null;
  }

  return cloneCachedBody(queryState.data.body);
};

export const cacheSuccessfulResponse = async (url, response) => {
  const responseClone = response.clone();
  const contentType = responseClone.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = {
    ok: responseClone.ok,
    status: responseClone.status,
    statusText: responseClone.statusText,
    url: resolveRequestUrl(url),
    headers: Object.fromEntries(responseClone.headers.entries()),
    isJson,
    body: isJson
      ? await responseClone.json().catch(() => null)
      : await responseClone.text().catch(() => ""),
  };

  queryClient.setQueryData(getApiCacheKey(url), payload);
  return payload;
};

export const invalidateApiCache = () =>
  queryClient.invalidateQueries({ queryKey: [API_CACHE_KEY_ROOT] });

export const clearApiCache = () => queryClient.clear();
