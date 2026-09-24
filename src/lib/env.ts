export function googleServerKey() {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || "";
}

export function googleBrowserKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
}

export function overpassUrl() {
  return process.env.OVERPASS_URL?.trim() || "https://overpass.osm.ch/api/interpreter";
}

export function overpassFallbacks() {
  const primary = overpassUrl();
  const extras = [
    "https://overpass.osm.ch/api/interpreter",
    "https://overpass-api.de/api/interpreter",
  ];
  return [primary, ...extras.filter((url) => url !== primary)];
}

export function adminPassword() {
  const value = process.env.ADMIN_PASSWORD?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!value || value === "yana-admin") {
      throw new Error("Set a strong ADMIN_PASSWORD in production");
    }
    return value;
  }
  return value || "yana-admin";
}

export function adminSessionSecret() {
  const value = process.env.ADMIN_SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!value || value === "yana-local-session-secret" || value === "change-me-in-production") {
      throw new Error("Set ADMIN_SESSION_SECRET in production");
    }
    return value;
  }
  return value || "yana-local-session-secret";
}

export function hasGoogleServer() {
  return Boolean(googleServerKey());
}
