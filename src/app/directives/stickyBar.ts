import type { Directive } from 'vue';
import { trackStuck } from './stuck';

// v-sticky-bar: deja fija (sticky) una barra de filtros/botones sobre una tabla al scrollear.
// Si un mismo contenedor tiene varias barras, se apilan una debajo de otra. La altura total se
// publica en --table-sticky-top sobre ese contenedor, y el encabezado de TableComponent la usa
// como `top` para quedar justo debajo.

/** Separación entre barras apiladas (y entre la última y el encabezado de la tabla). */
const GAP = 8;

const groups = new WeakMap<HTMLElement, Set<HTMLElement>>();
const parents = new WeakMap<HTMLElement, HTMLElement>();
const observers = new WeakMap<HTMLElement, ResizeObserver>();
const untrack = new WeakMap<HTMLElement, () => void>();

function layout(parent: HTMLElement) {
  const bars = [...(groups.get(parent) ?? [])]
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  let top = 0;
  for (const el of bars) {
    el.style.top = `${top}px`;
    top += el.offsetHeight + GAP;
  }
  parent.style.setProperty('--table-sticky-top', `${bars.length ? top : 0}px`);
}

export const vStickyBar: Directive<HTMLElement> = {
  mounted(el) {
    const parent = el.parentElement;
    if (!parent) return;
    el.style.position = 'sticky';
    el.style.zIndex = '4';
    if (!groups.has(parent)) groups.set(parent, new Set());
    groups.get(parent)!.add(el);
    parents.set(el, parent);
    const ro = new ResizeObserver(() => layout(parent));
    ro.observe(el);
    observers.set(el, ro);
    layout(parent);
    untrack.set(el, trackStuck(el));
  },
  unmounted(el) {
    observers.get(el)?.disconnect();
    untrack.get(el)?.();
    const parent = parents.get(el);
    if (!parent) return;
    groups.get(parent)?.delete(el);
    layout(parent);
  },
};
