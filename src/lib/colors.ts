import type { GroupTag } from '@/types/database'

/** Returnerer hex-farge for en gjestegruppe (matcher tailwind-tokens) */
export function groupColor(tag: GroupTag | null | undefined): string {
  switch (tag) {
    case 'brudepar':
      return '#C4A060' // gull
    case 'familie_stian':
      return '#7F77DD' // purple
    case 'familie_laila':
      return '#D4537E' // pink
    case 'venner_stian':
    case 'venner_laila':
      return '#378ADD' // blue
    case 'jobb_stian':
    case 'jobb_laila':
    case 'naboer':
    case 'annet':
    default:
      return '#1D9E75' // teal
  }
}

export function groupLabel(tag: GroupTag | null | undefined): string {
  switch (tag) {
    case 'brudepar':
      return 'Brudepar'
    case 'familie_stian':
      return 'Familie Stian'
    case 'familie_laila':
      return 'Familie Laila'
    case 'venner_stian':
      return 'Venner Stian'
    case 'venner_laila':
      return 'Venner Laila'
    case 'jobb_stian':
      return 'Jobb Stian'
    case 'jobb_laila':
      return 'Jobb Laila'
    case 'naboer':
      return 'Naboer'
    default:
      return 'Annet'
  }
}

export function ageLabel(age: string | null | undefined): string {
  switch (age) {
    case 'barn':
      return 'Barn'
    case 'ung_voksen':
      return 'Ung voksen'
    case 'voksen':
      return 'Voksen'
    case 'eldre':
      return 'Eldre'
    default:
      return ''
  }
}
