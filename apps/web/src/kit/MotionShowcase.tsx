import { useState } from "react";
import { Button, Card, getMotionPreset, m, useReducedMotion } from "@talentstroom/ui";
import type { MotionPresetName } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";

const presetNames: MotionPresetName[] = [
  "fade",
  "slideUp",
  "slideDown",
  "slideLeft",
  "slideRight",
  "scaleIn",
  "collapse",
  "expand",
  "listItem",
  "popover",
  "dialog",
  "sheetLeft",
  "sheetRight",
  "toast",
];
const presetKeys: Record<MotionPresetName, MessageKey> = {
  fade: "gallery.motion.fade",
  slideUp: "gallery.motion.slideUp",
  slideDown: "gallery.motion.slideDown",
  slideLeft: "gallery.motion.slideLeft",
  slideRight: "gallery.motion.slideRight",
  scaleIn: "gallery.motion.scaleIn",
  collapse: "gallery.motion.collapse",
  expand: "gallery.motion.expand",
  listItem: "gallery.motion.listItem",
  popover: "gallery.motion.popover",
  dialog: "gallery.motion.dialog",
  sheetLeft: "gallery.motion.sheetLeft",
  sheetRight: "gallery.motion.sheetRight",
  toast: "gallery.motion.toast",
};
export function MotionShowcase({ locale }: { locale: Locale }) {
  const reduced = useReducedMotion();
  const [reducedOverride, setReducedOverride] = useState(document.documentElement.dataset["motion"] === "reduce");
  const [replay, setReplay] = useState<Record<MotionPresetName, number>>({
    fade: 0,
    slideUp: 0,
    slideDown: 0,
    slideLeft: 0,
    slideRight: 0,
    scaleIn: 0,
    collapse: 0,
    expand: 0,
    listItem: 0,
    popover: 0,
    dialog: 0,
    sheetLeft: 0,
    sheetRight: 0,
    toast: 0,
  });
  const label = (key: MessageKey) => t(locale, key);
  return (
    <Card as="section" title={label("gallery.motion.title")}>
      <p>{label("gallery.motion.intro")}</p>
      <label className="motion-showcase-toggle">
        <input
          type="checkbox"
          checked={reducedOverride}
          onChange={(event) => {
            const enabled = event.currentTarget.checked;
            setReducedOverride(enabled);
            if (enabled) document.documentElement.dataset["motion"] = "reduce";
            else delete document.documentElement.dataset["motion"];
          }}
        />
        {label("gallery.motion.reduced")}
      </label>
      <div className="motion-showcase-grid">
        {presetNames.map((name) => {
          const preset = getMotionPreset(name, reduced);
          const itemLabel = label(presetKeys[name]);
          return (
            <section className="motion-showcase-item" key={name} aria-label={itemLabel}>
              <h3>{itemLabel}</h3>
              <div className="motion-showcase-stage">
                <m.div
                  key={`${name}-${replay[name]}`}
                  className="motion-showcase-sample"
                  variants={preset.variants}
                  initial="initial"
                  animate="animate"
                  transition={preset.transition}
                  aria-hidden="true"
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setReplay((current) => ({ ...current, [name]: current[name] + 1 }))}
              >
                {label("gallery.motion.replay")}
              </Button>
            </section>
          );
        })}
      </div>
    </Card>
  );
}
