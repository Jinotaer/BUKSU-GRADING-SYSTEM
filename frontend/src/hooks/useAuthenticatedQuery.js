import { useQuery } from "@tanstack/react-query";
import { authenticatedFetch } from "../utils/auth";

export const fetchAuthenticatedJson = async (url, options = {}) => {
  const response = await authenticatedFetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const useAuthenticatedQuery = ({
  queryKey,
  url,
  enabled = true,
  staleTime,
  select,
}) =>
  useQuery({
    queryKey,
    enabled,
    staleTime,
    select,
    queryFn: () => fetchAuthenticatedJson(url),
  });
