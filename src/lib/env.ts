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
  return process.env.ADMIN_PASSWORD?.trim() || "yana-admin";
}

export function adminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() || "yana-local-session-secret";
}

export function hasGoogleServer() {
  return Boolean(googleServerKey());
}
