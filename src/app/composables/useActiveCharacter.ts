import { computed } from 'vue';
import { useStore } from '../../middlewares/store';
import type { Character } from '../../interfaces';

/**
 * Personaje activo de la cuenta (store.currentCharacter) y su clan.
 * Si el ID guardado no coincide con ningún personaje, se usa el primero.
 */
export function useActiveCharacter() {
  const store = useStore();

  const chars  = computed<any[]>(() => store.currentUser.userData?.character ?? []);
  const active = computed<any | null>(() =>
    chars.value.find((c: Character) => c._id === store.currentCharacter) ?? chars.value[0] ?? null,
  );
  /** ID del clan del personaje activo (acepta `clan` poblado o como ID). */
  const clanId = computed<string | null>(() => active.value?.clan?._id ?? active.value?.clan ?? null);

  return { chars, active, clanId };
}
