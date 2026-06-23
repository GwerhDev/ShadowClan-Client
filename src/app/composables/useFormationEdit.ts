import { ref, computed } from 'vue';

export interface SWSlotRef {
  cat: string;
  matchIdx: number;
  group: 'group1' | 'group2';
  memberIndex: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  exalted: 'Sublime',
  eminent: 'Eminente',
  famed:   'Célebre',
  proud:   'Imponente',
};

export interface AssignedDetail {
  label: string;
  category: string;
  matchIndex: number;
  group: 'group1' | 'group2';
  memberIndex: number;
}

export function useSWFormationEdit(getBuffer: () => Record<string, any[]>) {
  const dragSource  = ref<SWSlotRef | null>(null);
  const dragOverKey = ref<string | null>(null);

  function slotKey(s: SWSlotRef) {
    return `${s.cat}-${s.matchIdx}-${s.group}-${s.memberIndex}`;
  }

  function getDragChar(s: SWSlotRef) {
    return getBuffer()[s.cat]?.[s.matchIdx]?.[s.group]?.character?.[s.memberIndex];
  }

  function setDragChar(s: SWSlotRef, char: any) {
    getBuffer()[s.cat][s.matchIdx][s.group].character[s.memberIndex] = char;
  }

  function onDragStart(e: DragEvent, slot: SWSlotRef) {
    if (!getDragChar(slot)) { e.preventDefault(); return; }
    dragSource.value = slot;
    e.dataTransfer!.effectAllowed = 'move';
  }

  function onDragOver(e: DragEvent, slot: SWSlotRef) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    dragOverKey.value = slotKey(slot);
  }

  function onDragLeave() { dragOverKey.value = null; }

  function onDragEnd() { dragSource.value = null; dragOverKey.value = null; }

  // Assigned IDs across all buffer slots
  const assignedMemberIds = computed(() => {
    const ids = new Set<string>();
    for (const matches of Object.values(getBuffer())) {
      for (const match of matches) {
        for (const grp of ['group1', 'group2'] as const) {
          for (const c of match[grp]?.character ?? []) {
            if (c?._id) ids.add(c._id);
          }
        }
      }
    }
    return Array.from(ids);
  });

  // Assigned details with human-readable label for each slot
  const assignedMemberDetails = computed(() => {
    const details: Record<string, AssignedDetail> = {};
    for (const [cat, matches] of Object.entries(getBuffer())) {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const base = (CATEGORY_LABELS[cat] ?? cat) + ' · P' + (i + 1);
        for (const grp of ['group1', 'group2'] as const) {
          (match[grp]?.character ?? []).forEach((c: any, memberIndex: number) => {
            if (c?._id) {
              details[c._id] = {
                label: base + (grp === 'group1' ? ' · G1' : ' · G2'),
                category: cat, matchIndex: i, group: grp, memberIndex,
              };
            }
          });
        }
      }
    }
    return details;
  });

  const selectionContext = ref<SWSlotRef | null>(null);
  const showMemberPicker = ref(false);

  function openSlotSelection(slot: SWSlotRef) {
    selectionContext.value = slot;
    showMemberPicker.value = true;
  }

  return {
    dragSource, dragOverKey, slotKey, getDragChar, setDragChar,
    onDragStart, onDragOver, onDragLeave, onDragEnd,
    assignedMemberIds, assignedMemberDetails,
    selectionContext, showMemberPicker, openSlotSelection,
  };
}

// ── AccursedTower variant (flat roster, no cat/matchIdx) ──────────────────────

export interface ATSlotRef {
  group: 'group1' | 'group2' | 'group3';
  index: number;
}

export function useATFormationEdit(
  getSlot: (group: ATSlotRef['group'], index: number) => any,
  setSlot: (group: ATSlotRef['group'], index: number, char: any) => void,
) {
  const dragSource  = ref<ATSlotRef | null>(null);
  const dragOverKey = ref<string | null>(null);

  function slotKey(group: string, index: number) { return `${group}-${index}`; }

  function onDragStart(e: DragEvent, group: ATSlotRef['group'], index: number) {
    if (!getSlot(group, index)) { e.preventDefault(); return; }
    dragSource.value = { group, index };
    e.dataTransfer!.effectAllowed = 'move';
  }

  function onDragOver(e: DragEvent, group: ATSlotRef['group'], index: number) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    dragOverKey.value = slotKey(group, index);
  }

  function onDragLeave() { dragOverKey.value = null; }

  function onDrop(group: ATSlotRef['group'], index: number, onSwap: () => void) {
    dragOverKey.value = null;
    if (!dragSource.value) return;
    const src = dragSource.value;
    dragSource.value = null;
    if (slotKey(src.group, src.index) === slotKey(group, index)) return;
    const srcChar = getSlot(src.group, src.index);
    const tgtChar = getSlot(group, index);
    setSlot(src.group, src.index, tgtChar);
    setSlot(group, index, srcChar);
    onSwap();
  }

  function onDragEnd() { dragSource.value = null; dragOverKey.value = null; }

  const selectionContext = ref<ATSlotRef | null>(null);
  const showModal        = ref(false);

  function openModal(group: ATSlotRef['group'], index: number) {
    selectionContext.value = { group, index };
    showModal.value = true;
  }

  return {
    dragSource, dragOverKey, slotKey,
    onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
    selectionContext, showModal, openModal,
  };
}
