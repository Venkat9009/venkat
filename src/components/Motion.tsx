"use client";

import { motion, type MotionProps } from "framer-motion";
import { type ReactNode } from "react";

type FadeUpProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
} & Omit<MotionProps, "children">;

export function FadeUp({ children, delay = 0, className, style, ...props }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay,
      }}
      className={className}
      style={{ willChange: "transform, opacity", ...style }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type ScaleInProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
} & Omit<MotionProps, "children">;

export function ScaleIn({ children, delay = 0, className, style, ...props }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        delay,
      }}
      className={className}
      style={{ willChange: "transform, opacity", ...style }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type HoverLiftProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
} & Omit<MotionProps, "children">;

export function HoverLift({ children, className, style, ...props }: HoverLiftProps) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={className}
      style={{ willChange: "transform", ...style }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type PressScaleProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
} & Omit<MotionProps, "children">;

export function PressScale({ children, className, style, onClick, ...props }: PressScaleProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={className}
      style={{ willChange: "transform", ...style }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.button>
  );
}
