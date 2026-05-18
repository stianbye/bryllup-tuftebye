import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Kombinerer klassenavn med clsx og tailwind-merge.
 * Brukes i alle UI-komponenter for å slå sammen klasser sikkert.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
