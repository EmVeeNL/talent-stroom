import type { MiddlewareHandler } from "hono";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { problem, type AppEnv } from "./problem.ts";

/** API-only policy: do not apply this CSP to the SPA's HTML responses. */
export const securityHeaders = secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'none'"],
  },
  strictTransportSecurity: "max-age=63072000; includeSubDomains",
  crossOriginOpenerPolicy: "same-origin",
  crossOriginResourcePolicy: "same-origin",
  referrerPolicy: "no-referrer",
  xContentTypeOptions: "nosniff",
  xFrameOptions: "DENY",
  removePoweredBy: true,
  permissionsPolicy: {
    accelerometer: false,
    autoplay: false,
    camera: false,
    displayCapture: false,
    encryptedMedia: false,
    fullscreen: false,
    geolocation: false,
    gyroscope: false,
    hid: false,
    magnetometer: false,
    microphone: false,
    midi: false,
    payment: false,
    pictureInPicture: false,
    screenWakeLock: false,
    serial: false,
    usb: false,
    xrSpatialTracking: false,
  },
});

export const cachePolicy: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();
  // A successful public route may deliberately set its own cache policy.
  // Errors must remain uncached even if a route set a header before failing.
  if (c.res.status >= 400 || !c.res.headers.has("Cache-Control")) {
    c.header("Cache-Control", "no-store");
  }
  c.res.headers.delete("Server");
};

export const requestBodyLimit = bodyLimit({
  maxSize: 1024 * 1024,
  onError: (c) => problem(c, "payloadTooLarge"),
});
