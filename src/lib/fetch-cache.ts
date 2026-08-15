export const FETCH_CACHE: RequestCache =
  process.env.STATIC_EXPORT === "1" ? "force-cache" : "no-store";
