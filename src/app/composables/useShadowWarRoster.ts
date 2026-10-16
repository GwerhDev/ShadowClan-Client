import { ref, Ref } from 'vue';
import { useStore } from '../../middlewares/store';
import { autoAssignRoster, updateShadowWarClan } from '../../middlewares/services';
import { SW_CATEGORIES, SWBattle, createEmptyBattle } from '../../middlewares/misc/shadowWar';
import { useSWFormationEdit, SWSlotRef } from './useFormationEdit';
import type { Character } from '../../interfaces';

type Group = 'group1' | 'group2';

const toId = (c: any): string | null => {
  if (!c) return null;
  return typeof c === 'string' ? c : (c._id ?? null);
};

/**
 * Estado y acciones de la formación de la Guerra Sombría activa (panel de gestión):
 * asignación de miembros, arrastrar y soltar, plantillas y persistencia.
 */
export function useShadowWarRoster(opts: {
  shadowWarId: Ref<string | null>;
  enemyClan:   Ref<string>;
  clanMembers: Ref<Character[]>;
  clanId:      Ref<string | null>;
}) {
  const store = useStore();
  const { shadowWarId, enemyClan, clanMembers, clanId } = opts;

  const battleCategories = ref<SWBattle>(createEmptyBattle());
  const autoAssigning    = ref(false);

  const {
    dragSource, dragOverKey, slotKey, getDragChar, setDragChar,
    onDragStart, onDragOver, onDragLeave, onDragEnd,
    assignedMemberIds, assignedMemberDetails,
  } = useSWFormationEdit(() => battleCategories.value as Record<string, any[]>);

  // ── Datos ──────────────────────────────────────────────────────────────────

  function resetBattleCategories() {
    battleCategories.value = createEmptyBattle();
  }

  function applyBattleData(battle: any) {
    if (!battle) return;
    const { exalted, eminent, famed, proud } = battle;
    battleCategories.value.exalted = exalted || battleCategories.value.exalted;
    battleCategories.value.eminent = eminent || battleCategories.value.eminent;
    battleCategories.value.famed   = famed   || battleCategories.value.famed;
    battleCategories.value.proud   = proud   || battleCategories.value.proud;
  }

  function setSlot(cat: string, matchIdx: number, group: Group, memberIndex: number, char: Character | undefined) {
    (battleCategories.value as Record<string, any[]>)[cat][matchIdx][group].character[memberIndex] = char;
  }

  /** Persiste la formación (y el clan enemigo actual) en la instancia activa. */
  async function updateShadowWarData() {
    if (!shadowWarId.value) return;

    const battleData: any = {};
    for (const [cat, matches] of Object.entries(battleCategories.value)) {
      battleData[cat] = (matches as any[]).map(match => ({
        result: match.result,
        group1: { character: match.group1.character.map(toId) },
        group2: { character: match.group2.character.map(toId) },
      }));
    }

    const formData = {
      enemyClan: enemyClan.value || null,
      battle: battleData,
    };
    const updated = await updateShadowWarClan(shadowWarId.value, formData, store.currentCharacter ?? undefined);
    if (updated) store.setShadowWarData(updated);
  }

  // ── Selección de miembros ──────────────────────────────────────────────────

  const showMemberSelectionModal = ref(false);
  const currentSelectionContext  = ref<SWSlotRef | null>(null);

  function openMemberSelection(slot: SWSlotRef) {
    currentSelectionContext.value  = slot;
    showMemberSelectionModal.value = true;
  }

  function handleMemberSelected(selectedMember: Character) {
    if (currentSelectionContext.value) {
      const { cat, matchIdx, group, memberIndex } = currentSelectionContext.value;
      setSlot(cat, matchIdx, group, memberIndex, selectedMember);
      updateShadowWarData();
    }
    showMemberSelectionModal.value = false;
  }

  function handleMemberUnassigned(characterId: string) {
    const detail = assignedMemberDetails.value[characterId];
    if (!detail) return;
    const { category, matchIndex, group, memberIndex } = detail;
    setSlot(category, matchIndex, group, memberIndex, undefined);
    updateShadowWarData();
  }

  function unassignMember(slot: SWSlotRef) {
    setSlot(slot.cat, slot.matchIdx, slot.group, slot.memberIndex, undefined);
    updateShadowWarData();
  }

  // ── Arrastrar y soltar ─────────────────────────────────────────────────────

  function onDrop(slot: SWSlotRef) {
    dragOverKey.value = null;
    if (!dragSource.value) return;
    const src = dragSource.value;
    if (slotKey(src) === slotKey(slot)) { dragSource.value = null; return; }

    const srcChar = getDragChar(src);
    const tgtChar = getDragChar(slot);
    setDragChar(src, tgtChar);
    setDragChar(slot, srcChar);

    dragSource.value = null;
    updateShadowWarData();
  }

  // ── Plantillas / auto-asignación ───────────────────────────────────────────

  /** Formación actual serializada a IDs (sin resultados). */
  function buildSWData() {
    const battleData: any = {};
    for (const [cat, matches] of Object.entries(battleCategories.value)) {
      battleData[cat] = (matches as any[]).map(match => ({
        group1: { character: match.group1.character.map(toId) },
        group2: { character: match.group2.character.map(toId) },
      }));
    }
    return battleData;
  }

  function applyAlignment(data: any) {
    if (!data) return;
    const findChar = (id: any) => clanMembers.value.find(c => String(c._id) === String(id));
    const padChars = (ids: any[], size: number) => {
      const chars = ids.map((id: any) => findChar(id));
      while (chars.length < size) chars.push(undefined);
      return chars.slice(0, size);
    };
    const result: any = {};
    for (const cat of SW_CATEGORIES) {
      const saved = (data[cat] ?? []) as any[];
      result[cat] = Array(3).fill(null).map((_, i) => {
        const m = saved[i] ?? {};
        return {
          group1: { character: padChars(m.group1?.character ?? [], 4) },
          group2: { character: padChars(m.group2?.character ?? [], 4) },
          result: 'pending',
        };
      });
    }
    battleCategories.value = result;
    updateShadowWarData();
  }

  async function autoAssign() {
    if (!clanId.value) return;
    autoAssigning.value = true;
    try {
      const current = buildSWData();
      const result = await autoAssignRoster(clanId.value, 'shadow-war', current);
      applyAlignment(result);
    } finally {
      autoAssigning.value = false;
    }
  }

  function resetAlignment() {
    resetBattleCategories();
    updateShadowWarData();
  }

  return {
    battleCategories, autoAssigning,
    resetBattleCategories, applyBattleData, updateShadowWarData,
    assignedMemberIds, assignedMemberDetails,
    showMemberSelectionModal, openMemberSelection, handleMemberSelected, handleMemberUnassigned, unassignMember,
    dragSource, dragOverKey, slotKey, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
    buildSWData, applyAlignment, autoAssign, resetAlignment,
  };
}
