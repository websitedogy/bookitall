export function isNativeRuntime() {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.(),
  );
}

export function isStandaloneWebApp() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function isAppShell() {
  return isNativeRuntime() || isStandaloneWebApp();
}
