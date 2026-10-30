import { useEffect, useState } from "react";
import { Icon } from "@talentstroom/ui";

const avif = import.meta.glob<string>("../assets/login/*.avif", { eager: true, query: "?url", import: "default" });
const webp = import.meta.glob<string>("../assets/login/*.webp", { eager: true, query: "?url", import: "default" });
const cities = Object.keys(avif)
  .filter((path) => !path.includes("-960"))
  .map((path) => path.split("/").pop()?.replace(".avif", "") ?? "amsterdam")
  .toSorted();
const photos = cities.map((city) => ({
  city,
  avif: [960, 1672]
    .map((width) => `${avif[`../assets/login/${city}${width === 960 ? "-960" : ""}.avif`]} ${width}w`)
    .join(", "),
  webp: [960, 1672]
    .map((width) => `${webp[`../assets/login/${city}${width === 960 ? "-960" : ""}.webp`]} ${width}w`)
    .join(", "),
  fallback: avif[`../assets/login/${city}.avif`],
}));
const initialIndex = Math.max(
  0,
  photos.findIndex((photo) => photo.city === "amsterdam"),
);

function Photo({ index, className, priority = false }: { index: number; className: string; priority?: boolean }) {
  const photo = photos[index];
  if (!photo) return null;
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={photo.avif} sizes="50vw" />
      <source type="image/webp" srcSet={photo.webp} sizes="50vw" />
      <img
        src={photo.fallback}
        alt=""
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
      />
    </picture>
  );
}

export function AuthHero() {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [incomingIndex, setIncomingIndex] = useState<number>();
  const [incomingVisible, setIncomingVisible] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    const schedule = () => {
      window.clearInterval(timer);
      if (motion.matches || document.hidden || photos.length < 2) return;
      timer = window.setInterval(() => {
        const nextIndex = (activeIndex + 1) % photos.length;
        const preload = new Image();
        preload.addEventListener(
          "load",
          () => {
            setIncomingVisible(false);
            setIncomingIndex(nextIndex);
          },
          { once: true },
        );
        preload.src = photos[nextIndex]?.fallback ?? "";
      }, 7000);
    };
    const onVisibility = () => {
      if (document.hidden) {
        window.clearInterval(timer);
        timer = undefined;
        setIncomingIndex(undefined);
        setIncomingVisible(false);
      } else schedule();
    };
    const onMotion = () => {
      if (motion.matches) {
        setIncomingIndex(undefined);
        setIncomingVisible(false);
      }
      schedule();
    };
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);
    schedule();
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
    };
  }, [activeIndex]);
  useEffect(() => {
    if (incomingIndex === undefined) return undefined;
    const frame = window.requestAnimationFrame(() => setIncomingVisible(true));
    const id = window.setTimeout(() => {
      setActiveIndex(incomingIndex);
      setIncomingIndex(undefined);
      setIncomingVisible(false);
    }, 1250);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(id);
    };
  }, [incomingIndex]);
  return (
    <>
      <div className="auth-hero-photos" aria-hidden="true">
        {photos[activeIndex] && <Photo index={activeIndex} className="auth-hero-photo is-active" priority />}
        {incomingIndex !== undefined && photos[incomingIndex] && (
          <Photo
            index={incomingIndex}
            className={`auth-hero-photo is-incoming${incomingVisible ? " is-visible" : ""}`}
          />
        )}
      </div>
      <span className="auth-hero-caption">
        <Icon name="location_on" size={16} />
        {photos[activeIndex]?.city.replace(/^./, (letter) => letter.toUpperCase())}
      </span>
    </>
  );
}
