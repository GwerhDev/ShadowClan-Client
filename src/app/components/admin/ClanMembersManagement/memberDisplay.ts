import { classes } from '../../../../middlewares/misc/const';

export function getClassImage(value: string) {
  return classes.find(c => c.value === value)?.image ?? '';
}

export function getClassName(value: string) {
  return classes.find(c => c.value === value)?.name ?? value;
}

function formatHistoryDate(d: string | Date) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}

/**
 * Resumen breve del historial de clanes de un personaje, para mostrar al agregarlo
 * o al revisar su solicitud de ingreso — no bloqueante, solo informativo.
 */
export function clanHistorySummary(char: any) {
  const history = char?.clanHistory;
  if (!history?.length) return null;
  const last     = history[0];
  const clanName = last.clan?.name ?? 'clan desconocido';
  const range    = !last.joinedAt
    ? `hasta ${formatHistoryDate(last.leftAt)}`
    : last.leftAt
      ? `${formatHistoryDate(last.joinedAt)} – ${formatHistoryDate(last.leftAt)}`
      : `desde ${formatHistoryDate(last.joinedAt)}`;
  const extra = history.length > 1 ? ` · +${history.length - 1} más` : '';
  return `Historial: ${clanName} (${range})${extra}`;
}
