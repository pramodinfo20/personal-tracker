// Tiny classnames joiner — avoids pulling in a dependency for something this small.

export type ClassValue = string | false | null | undefined

export const cn = (...classes: ClassValue[]): string => classes.filter(Boolean).join(' ')
