import type { Directive } from 'vue';

// Fondo solo mientras un elemento sticky está efectivamente pegado (fuera de eso conserva su
// estilo normal). Escucha el scroll del contenedor scrolleable más cercano.

const STUCK_BG = 'var(--color-secondary-bg)';
const cleanups = new WeakMap<HTMLElement, () => void>();

function scrollParent(el: HTMLElement): HTMLElement {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p;
  }
  return document.scrollingElement as HTMLElement;
}

/** Empieza a seguir `el`; devuelve la función para dejar de hacerlo. */
export function trackStuck(el: HTMLElement): () => void {
  const scroller = scrollParent(el);
  const isRoot = scroller === document.scrollingElement;
  let frame = 0;
  const update = () => {
    frame = 0;
    const top = parseFloat(getComputedStyle(el).top) || 0;
    // El sticky se pega dentro del padding del contenedor scrolleable.
    const edge = (isRoot ? 0 : scroller.getBoundingClientRect().top) + (parseFloat(getComputedStyle(scroller).paddingTop) || 0);
    const stuck = scroller.scrollTop > 0 && el.getBoundingClientRect().top <= edge + top + 1;
    el.style.background = stuck ? STUCK_BG : '';
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const target: HTMLElement | Window = isRoot ? window : scroller;
  target.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
  return () => {
    target.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    if (frame) cancelAnimationFrame(frame);
  };
}

export const vStuck: Directive<HTMLElement> = {
  mounted(el) { cleanups.set(el, trackStuck(el)); },
  unmounted(el) { cleanups.get(el)?.(); cleanups.delete(el); },
};
