import { useStore } from '../store';

/**
 * ID del personaje activo (store.currentCharacter).
 * Se lee en tiempo de llamada (no al importar) para evitar el ciclo store ↔ services.
 */
export function activeCharacterId(): string | undefined {
  return useStore().currentCharacter || undefined;
}

/**
 * Query params con el personaje activo como "actor".
 * Requerido por /clan-management/clan/:clanId/* y otras rutas que verifican
 * los permisos sobre el personaje activo (no sobre cualquiera de la cuenta).
 */
export function actorParams(): { characterId?: string } {
  const id = activeCharacterId();
  return id ? { characterId: id } : {};
}
