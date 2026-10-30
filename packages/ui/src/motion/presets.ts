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
  | "listItem";
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
};

export function getMotionPreset(name: MotionPresetName, reducedMotion = false): MotionPreset {
  if (!reducedMotion) return motionPresets[name];
  const opacity =
    name === "fade" ||
    name === "slideUp" ||
    name === "slideDown" ||
    name === "slideLeft" ||
    name === "slideRight" ||
    name === "scaleIn" ||
    name === "listItem";
  return {
    variants: {
      initial: opacity ? { opacity: 0 } : { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    transition: { duration: name === "fade" ? motionDurations.fast / 1000 : 0 },
  };
}
