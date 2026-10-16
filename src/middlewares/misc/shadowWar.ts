import type { Match } from '../../interfaces';

/**
 * Definiciones únicas de las categorías de batalla de la Guerra Sombría.
 * Importar desde aquí en lugar de redeclarar etiquetas, puntajes o fábricas.
 */

export const SW_CATEGORIES = ['exalted', 'eminent', 'famed', 'proud'] as const;
export type SWCategory = typeof SW_CATEGORIES[number];

/** Etiqueta visible de cada categoría (con mayúscula inicial). */
export const SW_CATEGORY_LABELS: Record<SWCategory, string> = {
  exalted: 'Sublime',
  eminent: 'Eminente',
  famed:   'Célebre',
  proud:   'Imponente',
};

/** Puntos que otorga cada partida ganada según la categoría. */
export const SW_CATEGORY_POINTS: Record<SWCategory, number> = {
  exalted: 8,
  eminent: 4,
  famed:   2,
  proud:   1,
};

/** Texto de puntos por categoría ("8pts", "1pt"). */
export const SW_CATEGORY_POINTS_LABEL: Record<SWCategory, string> = {
  exalted: '8pts',
  eminent: '4pts',
  famed:   '2pts',
  proud:   '1pt',
};

export const SW_MATCHES_PER_CATEGORY = 3;
export const SW_GROUP_SIZE = 4;

/** Etiqueta de la categoría o la clave original si no es una categoría conocida. */
export function swCategoryLabel(cat: string): string {
  return SW_CATEGORY_LABELS[cat as SWCategory] ?? cat;
}

/** Puntos por partida de la categoría (1 por defecto). */
export function swCategoryPoints(cat: string): number {
  return SW_CATEGORY_POINTS[cat as SWCategory] ?? 1;
}

/** Partida vacía: dos grupos de 4 espacios sin asignar, resultado pendiente. */
export function createEmptyMatch(): Match {
  return {
    group1: { character: Array(SW_GROUP_SIZE).fill(undefined) },
    group2: { character: Array(SW_GROUP_SIZE).fill(undefined) },
    result: 'pending',
  };
}

export type SWBattle = Record<SWCategory, Match[]>;

/** Batalla completa vacía (3 partidas por categoría). */
export function createEmptyBattle(): SWBattle {
  const battle = {} as SWBattle;
  for (const cat of SW_CATEGORIES) {
    battle[cat] = Array.from({ length: SW_MATCHES_PER_CATEGORY }, createEmptyMatch);
  }
  return battle;
}
