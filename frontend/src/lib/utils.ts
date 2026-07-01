import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind CSS class names, resolving conflicts via `tailwind-merge`. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
