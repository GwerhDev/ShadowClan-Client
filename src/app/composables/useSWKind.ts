import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue';
import { useStore } from '../../middlewares/store';
import { shadowWarApi, vigilApi, type SWKind, type SWService } from '../../middlewares/services/shadowWarService';
import type { ShadowWar } from '../../interfaces';

/**
 * Contexto del tipo de instancia con formación de Guerra Sombría. La Guerra Sombría y la
 * Vigilia de Espadas reutilizan los mismos componentes (formación, historial, vista de
 * miembros); el contenedor llama a `provideSWKind(kind)` y los hijos usan `useSWKind()`.
 * Sin proveedor, el tipo es Guerra Sombría (comportamiento original).
 */
export interface SWKindContext {
  kind: SWKind;
  /** Nombre visible: "Guerra Sombría" / "Vigilia de Espadas". */
  label: string;
  /** Nombre corto para tabs y títulos compactos. */
  shortLabel: string;
  api: SWService;
  /** Instancia activa del clan (store). */
  active: ComputedRef<ShadowWar | null>;
  /** Asignaciones del personaje activo en la instancia activa. */
  battleInfo: ComputedRef<{ category: string; match: number; group: number }[]>;
  refreshActive(): Promise<void>;
  setActive(data: ShadowWar | null): void;
  /** Segmento de ruta: 'shadow-war' | 'vigil-of-blades'. */
  routeSegment: 'shadow-war' | 'vigil-of-blades';
  /** `source` de los posts del feed y `type` del historial. */
  source: SWKind;
}

const KEY: InjectionKey<SWKindContext> = Symbol('sw-kind');

const META: Record<SWKind, Pick<SWKindContext, 'label' | 'shortLabel' | 'routeSegment'>> = {
  shadow_war:      { label: 'Guerra Sombría',     shortLabel: 'Guerra',  routeSegment: 'shadow-war' },
  vigil_of_blades: { label: 'Vigilia de Espadas', shortLabel: 'Vigilia', routeSegment: 'vigil-of-blades' },
};

export function createSWKindContext(kind: SWKind): SWKindContext {
  const store = useStore();
  const isVigil = kind === 'vigil_of_blades';
  return {
    kind,
    ...META[kind],
    api: isVigil ? vigilApi : shadowWarApi,
    active: computed(() => (isVigil ? store.currentUser.vigilData : store.currentUser.shadowWarData)),
    battleInfo: computed(() => (isVigil ? store.userVigilBattleInfo : store.userBattleInfo)),
    refreshActive: () => store.handleGetActiveSW(kind),
    setActive: (data) => (isVigil ? store.setVigilData(data) : store.setShadowWarData(data)),
    source: kind,
  };
}

/** Lo llama el contenedor (página/ruta) para fijar el tipo de sus hijos. */
export function provideSWKind(kind: SWKind): SWKindContext {
  const ctx = createSWKindContext(kind);
  provide(KEY, ctx);
  return ctx;
}

/** Tipo de instancia actual (por defecto Guerra Sombría). */
export function useSWKind(): SWKindContext {
  return inject(KEY, null) ?? createSWKindContext('shadow_war');
}

export const SW_KIND_LABEL: Record<SWKind, string> = {
  shadow_war: META.shadow_war.label,
  vigil_of_blades: META.vigil_of_blades.label,
};
