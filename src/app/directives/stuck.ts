import type { Directive } from 'vue';

// Clase `is-stuck` solo mientras un elemento sticky está efectivamente pegado (fuera de eso
// conserva su estilo normal; el fondo vive en styles/style.css).
// Los elementos pegados contiguos (p. ej. barra de filtros + encabezado de tabla, o "Partida N" +
// "Grupo 1/2") forman un grupo: el de más arriba dibuja UN solo fondo que se extiende hasta cubrir
// al resto (--stuck-extend) y los demás llevan `is-stuck--covered` (sin fondo propio), para que
// no se solapen fondos translúcidos.

/** Distancia máxima entre elementos pegados para considerarlos parte del mismo panel. */
const JOIN_GAP = 12;

const tracked = new Map<HTMLElement, Set<HTMLElement>>(); // contenedor scrolleable → elementos
const detach = new Map<HTMLElement, () => void>();         // contenedor scrolleable → limpiar listeners
const cleanups = new WeakMap<HTMLElement, () => void>();

function scrollParent(el: HTMLElement): HTMLElement {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p;
  }
  return document.scrollingElement as HTMLElement;
}

function update(scroller: HTMLElement) {
  const els = tracked.get(scroller);
  if (!els) return;
  const isRoot = scroller === document.scrollingElement;
  // El sticky se pega dentro del padding del contenedor scrolleable.
  const padTop = parseFloat(getComputedStyle(scroller).paddingTop) || 0;
  const edge = (isRoot ? 0 : scroller.getBoundingClientRect().top) + padTop;

  const stuck: { el: HTMLElement; top: number; bottom: number }[] = [];
  for (const el of els) {
    const top = parseFloat(getComputedStyle(el).top) || 0;
    const r = el.getBoundingClientRect();
    // Pegado (o siendo empujado fuera por el final de su contenedor) y todavía visible.
    const isStuck = scroller.scrollTop > 0 && r.height > 0 && r.top <= edge + top + 1 && r.bottom > edge;
    el.style.setProperty('--stuck-lift', top < 1 ? `${padTop}px` : '0px');
    if (isStuck) stuck.push({ el, top: r.top, bottom: r.bottom });
    else el.classList.remove('is-stuck', 'is-stuck--covered');
  }

  stuck.sort((a, b) => a.top - b.top);
  let i = 0;
  while (i < stuck.length) {
    const lead = stuck[i];
    let bottom = lead.bottom;
    let j = i + 1;
    while (j < stuck.length && stuck[j].top <= bottom + JOIN_GAP) {
      bottom = Math.max(bottom, stuck[j].bottom);
      j++;
    }
    lead.el.classList.add('is-stuck');
    lead.el.classList.remove('is-stuck--covered');
    lead.el.style.setProperty('--stuck-extend', `${bottom - lead.bottom}px`);
    for (let k = i + 1; k < j; k++) stuck[k].el.classList.add('is-stuck', 'is-stuck--covered');
    i = j;
  }
}

/** Empieza a seguir `el`; devuelve la función para dejar de hacerlo. */
export function trackStuck(el: HTMLElement): () => void {
  const scroller = scrollParent(el);
  if (!tracked.has(scroller)) {
    tracked.set(scroller, new Set());
    let frame = 0;
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(scroller); }); };
    const target: HTMLElement | Window = scroller === document.scrollingElement ? window : scroller;
    target.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    detach.set(scroller, () => {
      target.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    });
  }
  tracked.get(scroller)!.add(el);
  update(scroller);
  return () => {
    const set = tracked.get(scroller);
    set?.delete(el);
    el.classList.remove('is-stuck', 'is-stuck--covered');
    if (set && !set.size) {
      detach.get(scroller)?.();
      detach.delete(scroller);
      tracked.delete(scroller);
    } else {
      update(scroller);
    }
  };
}

export const vStuck: Directive<HTMLElement> = {
  mounted(el) { cleanups.set(el, trackStuck(el)); },
  unmounted(el) { cleanups.get(el)?.(); cleanups.delete(el); },
};
