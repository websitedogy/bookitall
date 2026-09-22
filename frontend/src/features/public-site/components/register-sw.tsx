"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => void registration.unregister());
      });
      return;
    }
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      void registration.update();
    }).catch(() => undefined);
  }, []);
  return null;
}
