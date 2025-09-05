// src/lib/utils.ts
import { type ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional classNames + resolve Tailwind conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
