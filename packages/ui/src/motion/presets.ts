import type { Transition, Variants } from "motion/react";
import { motionDurations, motionEasings } from "../tokens.ts";

export type MotionPresetName =
  | "fade"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleIn"
  | "collapse"
  | "expand"
  | "listItem"
  | "popover"
  | "dialog"
  | "sheetLeft"
  | "sheetRight"
  | "toast";
export interface MotionPreset {
  variants: Variants;
  transition: Transition;
}

const easing = {
  standard: motionEasings.standard,
  emphasised: motionEasings.emphasised,
  exit: motionEasings.exit,
};
const transitions: Record<"fast" | "base" | "slow", Transition> = {
  fast: { duration: motionDurations.fast / 1000, ease: easing.standard },
  base: { duration: motionDurations.base / 1000, ease: easing.emphasised },
  slow: { duration: motionDurations.slow / 1000, ease: easing.emphasised },
};
const variants: Record<MotionPresetName, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: (motionDurations.base * 0.75) / 1000, ease: easing.exit } },
  },
  slideUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4, transition: { duration: (motionDurations.base * 0.75) / 1000, ease: easing.exit } },
  },
  slideDown: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 4, transition: { duration: (motionDurations.base * 0.75) / 1000, ease: easing.exit } },
  },
  slideLeft: {
    initial: { opacity: 0, x: 8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -4, transition: { duration: (motionDurations.base * 0.75) / 1000, ease: easing.exit } },
  },
  slideRight: {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 4, transition: { duration: (motionDurations.base * 0.75) / 1000, ease: easing.exit } },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: { duration: (motionDurations.base * 0.75) / 1000, ease: easing.exit },
    },
  },
  collapse: {
    initial: { height: "auto", opacity: 1 },
    animate: { height: 0, opacity: 0 },
    exit: {
      height: "auto",
      opacity: 1,
      transition: { duration: (motionDurations.slow * 0.75) / 1000, ease: easing.exit },
    },
  },
  expand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0, transition: { duration: (motionDurations.slow * 0.75) / 1000, ease: easing.exit } },
  },
  listItem: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4, transition: { duration: (motionDurations.fast * 0.75) / 1000, ease: easing.exit } },
  },
  popover: {
    initial: { opacity: 0, scale: 0.98, transformOrigin: "var(--ts-motion-origin, center)" },
    animate: { opacity: 1, scale: 1 },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: { duration: (motionDurations.base * 0.75) / 1000, ease: easing.exit },
    },
  },
  dialog: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: { duration: (motionDurations.base * 0.75) / 1000, ease: easing.exit },
    },
  },
  sheetLeft: {
    initial: { opacity: 0, x: -24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24, transition: { duration: (motionDurations.slow * 0.75) / 1000, ease: easing.exit } },
  },
  sheetRight: {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 24, transition: { duration: (motionDurations.slow * 0.75) / 1000, ease: easing.exit } },
  },
  toast: {
    initial: { opacity: 0, x: 8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 8, transition: { duration: (motionDurations.base * 0.75) / 1000, ease: easing.exit } },
  },
};

export const motionPresets: Record<MotionPresetName, MotionPreset> = {
  fade: { variants: variants.fade, transition: transitions.base },
  slideUp: { variants: variants.slideUp, transition: transitions.base },
  slideDown: { variants: variants.slideDown, transition: transitions.base },
  slideLeft: { variants: variants.slideLeft, transition: transitions.base },
  slideRight: { variants: variants.slideRight, transition: transitions.base },
  scaleIn: { variants: variants.scaleIn, transition: transitions.base },
  collapse: { variants: variants.collapse, transition: transitions.slow },
  expand: { variants: variants.expand, transition: transitions.slow },
  listItem: { variants: variants.listItem, transition: transitions.slow },
  popover: { variants: variants.popover, transition: transitions.fast },
  dialog: { variants: variants.dialog, transition: transitions.base },
  sheetLeft: { variants: variants.sheetLeft, transition: transitions.slow },
  sheetRight: { variants: variants.sheetRight, transition: transitions.slow },
  toast: { variants: variants.toast, transition: transitions.base },
};

export function getMotionPreset(name: MotionPresetName, reducedMotion = false): MotionPreset {
  if (!reducedMotion) return motionPresets[name];
  return {
    variants: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    transition: { duration: name === "fade" ? motionDurations.fast / 1000 : 0 },
  };
}
