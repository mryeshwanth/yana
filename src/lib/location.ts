export async function requestLocation(): Promise<
  | { ok: true; lat: number; lng: number }
  | { ok: false; blocked: boolean; message: string }
> {
  if (!navigator.geolocation) {
    return { ok: false, blocked: true, message: "This browser cannot share location." };
  }

  let permission: PermissionState | "unknown" = "unknown";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    permission = status.state;
  } catch {
    permission = "unknown";
  }

  if (permission === "denied") {
    return {
      ok: false,
      blocked: true,
      message:
        "Location is blocked for this site. Enable it in the browser site settings, then tap the location icon again.",
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({
            ok: false,
            blocked: true,
            message:
              "Location is blocked for this site. Enable it in the browser site settings, then tap the location icon again.",
          });
          return;
        }
        resolve({
          ok: false,
          blocked: false,
          message: "Could not read your location. Try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}
