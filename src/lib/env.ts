function readEnv(name: string) {
  const raw = process.env[name];
  if (!raw) return "";
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

export function googleServerKey() {
  return readEnv("GOOGLE_MAPS_API_KEY");
}

export function googleBrowserKey() {
  return readEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
}

export function overpassUrl() {
  return readEnv("OVERPASS_URL") || "https://overpass.osm.ch/api/interpreter";
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
  const value = readEnv("ADMIN_PASSWORD");
  if (process.env.NODE_ENV === "production") {
    if (!value || value === "yana-admin") {
      throw new Error("Set a strong ADMIN_PASSWORD in Railway (not yana-admin).");
    }
    return value;
  }
  return value || "yana-admin";
}

export function adminSessionSecret() {
  const value = readEnv("ADMIN_SESSION_SECRET");
  if (process.env.NODE_ENV === "production") {
    if (!value || value === "yana-local-session-secret" || value === "change-me-in-production") {
      throw new Error("Set ADMIN_SESSION_SECRET in Railway to a long random string.");
    }
    return value;
  }
  return value || "yana-local-session-secret";
}

export function hasGoogleServer() {
  return Boolean(googleServerKey());
}
