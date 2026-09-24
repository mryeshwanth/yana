export function formatMinutes(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

export function formatDistance(meters: number) {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
}

export function availabilityLabel(state: "live" | "estimated" | "unknown") {
  if (state === "live") return "Live";
  if (state === "estimated") return "Estimated";
  return "Unknown";
}
