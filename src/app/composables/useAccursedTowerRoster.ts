import { ref, computed, Ref } from 'vue';
import { useStore } from '../../middlewares/store';
import { autoAssignRoster, updateAccursedTower } from '../../middlewares/services';
import { useATFormationEdit, ATSlotRef } from './useFormationEdit';
import type { Character } from '../../interfaces';

export type ATGroup = ATSlotRef['group'];

export interface ATRoster {
  group1: (Character | undefined)[];
  group2: (Character | undefined)[];
  group3: (Character | undefined)[];
}

export const AT_GROUP_SIZES: Record<ATGroup, number> = {
  group1: 4, group2: 4, group3: 2,
};

export function padGroup(arr: any[] | undefined, size: number): (Character | undefined)[] {
  const result = [...(arr ?? [])];
  while (result.length < size) result.push(undefined);
  return result;
}

/** Roster de 4/4/2 a partir de los datos guardados de una torre. */
export function rosterFromTower(roster: any): ATRoster {
  return {
    group1: padGroup(roster?.group1, 4),
    group2: padGroup(roster?.group2, 4),
    group3: padGroup(roster?.group3, 2),
  };
}

const emptyRoster = (): ATRoster => ({
  group1: Array(4).fill(undefined),
  group2: Array(4).fill(undefined),
  group3: Array(2).fill(undefined),
});

/**
 * Formación editable de la Torre Maldita expandida en el panel de gestión:
 * asignación, arrastrar y soltar, plantillas y persistencia.
 */
export function useAccursedTowerRoster(opts: {
  expandedId:  Ref<string | null>;
  towerWars:   Ref<any[]>;
  clanMembers: Ref<Character[]>;
  clanId:      Ref<string | null>;
}) {
  const store = useStore();
  const { expandedId, towerWars, clanMembers, clanId } = opts;

  const localRoster   = ref<ATRoster>(emptyRoster());
  const autoAssigning = ref(false);

  function getSlot(group: ATGroup, index: number) {
    return localRoster.value[group][index];
  }

  function setSlot(group: ATGroup, index: number, char: Character | undefined) {
    localRoster.value[group][index] = char;
  }

  const {
    dragSource, dragOverKey, slotKey,
    onDragStart, onDragOver, onDragLeave, onDrop: _onDrop, onDragEnd,
    selectionContext, showModal, openModal,
  } = useATFormationEdit(getSlot, setSlot);

  const assignedIds = computed(() => {
    const ids = new Set<string>();
    for (const grp of ['group1', 'group2', 'group3'] as const) {
      for (const c of localRoster.value[grp]) { if (c?._id) ids.add(c._id); }
    }
    return Array.from(ids);
  });

  function loadRoster(roster: any) {
    localRoster.value = rosterFromTower(roster);
  }

  const toIds = (arr: (Character | undefined)[]) => arr.map(c => c?._id ?? null);

  function buildATData() {
    return {
      group1: toIds(localRoster.value.group1),
      group2: toIds(localRoster.value.group2),
      group3: toIds(localRoster.value.group3),
    };
  }

  async function saveRoster() {
    if (!expandedId.value) return;
    const updated = await updateAccursedTower(expandedId.value, {
      roster: buildATData(),
    }, store.currentCharacter ?? undefined);
    // Sincroniza la lista
    const idx = towerWars.value.findIndex(tw => tw._id === expandedId.value);
    if (idx !== -1) towerWars.value[idx] = updated;
  }

  function applyAlignment(data: any) {
    if (!data || !expandedId.value) return;
    const findChar = (id: any) => clanMembers.value.find(c => String(c._id) === String(id)) as Character | undefined;
    localRoster.value = {
      group1: padGroup((data.group1 ?? []).map(findChar), 4),
      group2: padGroup((data.group2 ?? []).map(findChar), 4),
      group3: padGroup((data.group3 ?? []).map(findChar), 2),
    };
    saveRoster();
  }

  async function autoAssign() {
    if (!clanId.value || !expandedId.value) return;
    autoAssigning.value = true;
    try {
      const result = await autoAssignRoster(clanId.value, 'accursed-tower');
      applyAlignment(result);
    } finally {
      autoAssigning.value = false;
    }
  }

  function resetRoster() {
    localRoster.value = emptyRoster();
    saveRoster();
  }

  function handleMemberSelected(character: Character) {
    if (!selectionContext.value) return;
    const { group, index } = selectionContext.value;
    setSlot(group, index, character);
    showModal.value = false;
    saveRoster();
  }

  function unassign(group: ATGroup, index: number) {
    setSlot(group, index, undefined);
    saveRoster();
  }

  function onDrop(group: ATGroup, index: number) {
    _onDrop(group, index, saveRoster);
  }

  function resetDrag() {
    dragSource.value  = null;
    dragOverKey.value = null;
  }

  return {
    localRoster, autoAssigning, assignedIds,
    loadRoster, buildATData, saveRoster, applyAlignment, autoAssign, resetRoster,
    showModal, openModal, handleMemberSelected, unassign,
    dragSource, dragOverKey, slotKey, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, resetDrag,
  };
}
