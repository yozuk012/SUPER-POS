"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  FiDownload,
  FiRefreshCw,
  FiShare,
  FiWifiOff,
  FiX,
} from "react-icons/fi";

const INSTALL_DISMISS_KEY = "superpos:pwa-install-dismissed-at";
const INSTALL_DISMISS_DAYS = 14;

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.navigator.standalone === true
  );
}

function isIosDevice() {
  const ua = window.navigator.userAgent;
  const isIosUa = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ memakai user agent desktop.
  const isIpadOs =
    window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1;
  return isIosUa || isIpadOs;
}

function subscribeToConnectivity(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

const getConnectivitySnapshot = () => window.navigator.onLine;
const getServerConnectivitySnapshot = () => true;

/**
 * Menangani seluruh kebutuhan PWA:
 * - registrasi service worker (production)
 * - notifikasi versi baru
 * - status offline
 * - prompt install aplikasi (Android/desktop + panduan iOS)
 */
export default function PWAProvider() {
  const isOnline = useSyncExternalStore(
    subscribeToConnectivity,
    getConnectivitySnapshot,
    getServerConnectivitySnapshot
  );
  const isOffline = !isOnline;
  const [installMode, setInstallMode] = useState(null); // "prompt" | "ios"
  const [updateReady, setUpdateReady] = useState(false);

  const deferredPromptRef = useRef(null);
  const registrationRef = useRef(null);
  const reloadingRef = useRef(false);

  /* ── Service worker ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Di development, bersihkan SW/cache lama agar aset tidak basi.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister()))
        )
        .catch(() => {});
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith("superpos-"))
                .map((key) => caches.delete(key))
            )
          )
          .catch(() => {});
      }
      return;
    }

    let cancelled = false;

    const handleControllerChange = () => {
      if (reloadingRef.current) window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (cancelled) return;
        registrationRef.current = registration;

        if (registration.waiting) setUpdateReady(true);

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateReady(true);
            }
          });
        });
      })
      .catch((error) => {
        console.warn("Registrasi service worker gagal:", error);
      });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  /* ── Prompt install ────────────────────────────────────────────────── */
  const dismissInstall = useCallback(() => {
    try {
      window.localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage bisa diblokir (private mode), abaikan.
    }
    setInstallMode(null);
  }, []);

  useEffect(() => {
    if (isStandaloneMode()) return;

    let dismissedAt = 0;
    try {
      dismissedAt = Number(window.localStorage.getItem(INSTALL_DISMISS_KEY));
    } catch {
      dismissedAt = 0;
    }
    if (dismissedAt && Date.now() - dismissedAt < INSTALL_DISMISS_DAYS * 86400000) {
      return;
    }

    const iosTimer = isIosDevice()
      ? window.setTimeout(() => setInstallMode("ios"), 0)
      : null;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      deferredPromptRef.current = event;
      setInstallMode("prompt");
    };

    const handleInstalled = () => {
      deferredPromptRef.current = null;
      setInstallMode(null);
      try {
        window.localStorage.removeItem(INSTALL_DISMISS_KEY);
      } catch {
        // abaikan
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      if (iosTimer) window.clearTimeout(iosTimer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return;

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      deferredPromptRef.current = null;
      if (choice?.outcome === "accepted") {
        setInstallMode(null);
      } else {
        dismissInstall();
      }
    } catch (error) {
      console.warn("Install prompt gagal dibuka:", error);
    }
  };

  const handleUpdate = () => {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) {
      window.location.reload();
      return;
    }
    reloadingRef.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <>
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 z-[70] flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 shadow-lg"
        >
          <FiWifiOff className="text-base" aria-hidden="true" />
          <span>Mode offline — data mungkin belum terbaru</span>
        </div>
      )}

      {updateReady && (
        <div className="fixed left-1/2 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-blue-200 bg-white px-4 py-3 shadow-xl">
          <FiRefreshCw className="shrink-0 text-lg text-blue-600" aria-hidden="true" />
          <p className="flex-1 text-xs font-semibold text-slate-700">
            Versi baru SuperPOS tersedia.
          </p>
          <button
            type="button"
            onClick={handleUpdate}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
          >
            Muat ulang
          </button>
          <button
            type="button"
            onClick={() => setUpdateReady(false)}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup notifikasi pembaruan"
          >
            <FiX className="text-base" />
          </button>
        </div>
      )}

      {installMode && (
        <div
          className={`fixed left-4 right-4 z-[70] rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl sm:left-auto sm:w-80 ${
            isOffline ? "bottom-20" : "bottom-4"
          }`}
        >
          <button
            type="button"
            onClick={dismissInstall}
            className="absolute right-2 top-2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup ajakan memasang aplikasi"
          >
            <FiX className="text-base" />
          </button>

          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- ikon statis PWA */}
            <img
              src="/icons/icon-96.png"
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 object-contain"
            />
            <div className="min-w-0 pr-4">
              <p className="text-sm font-bold text-slate-900">Pasang SuperPOS</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {installMode === "ios"
                  ? "Ketuk ikon Bagikan di Safari, lalu pilih “Tambah ke Layar Utama”."
                  : "Akses lebih cepat langsung dari layar utama, tanpa membuka browser."}
              </p>
            </div>
          </div>

          {installMode === "prompt" ? (
            <button
              type="button"
              onClick={handleInstall}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
            >
              <FiDownload className="text-base" aria-hidden="true" />
              Pasang aplikasi
            </button>
          ) : (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700">
              <FiShare className="text-base" aria-hidden="true" />
              Bagikan → Tambah ke Layar Utama
            </div>
          )}
        </div>
      )}
    </>
  );
}
