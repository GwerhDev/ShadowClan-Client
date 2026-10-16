import { ref, Ref, ComputedRef } from 'vue';
import { useStore } from '../../middlewares/store';
import { getClanMembers, updateShadowWarClan } from '../../middlewares/services';
import { useSWFormationEdit, SWSlotRef } from './useFormationEdit';
import type { ShadowWar } from '../../interfaces';

function cleanMatch(m: any) {
  return {
    result: m.result,
    group1: { character: (m.group1?.character ?? []).filter(Boolean).map((c: any) => c?._id ?? c) },
    group2: { character: (m.group2?.character ?? []).filter(Boolean).map((c: any) => c?._id ?? c) },
  };
}

/**
 * Edición de formación por categoría en el detalle histórico de una Guerra Sombría.
 * Al expandir una categoría se crea un buffer editable; cada cambio se guarda al instante.
 */
export function useHistorySWFormation(currentShadowWar: ComputedRef<ShadowWar | null>, saving: Ref<boolean>) {
  const store = useStore();

  const expandedCategories  = ref<string[]>([]);
  const formationEditCats   = ref<string[]>([]);
  const formationEditBuffer = ref<Record<string, any>>({});
  const clanMembers         = ref<any[]>([]);
  const showMemberPicker    = ref(false);

  const {
    dragSource, dragOverKey, slotKey, getDragChar, setDragChar,
    onDragStart, onDragOver, onDragLeave, onDragEnd,
    assignedMemberIds, assignedMemberDetails,
    selectionContext, openSlotSelection: _openSlotSelection,
  } = useSWFormationEdit(() => formationEditBuffer.value);

  async function loadClanMembers() {
    if (clanMembers.value.length) return;
    const sw = currentShadowWar.value;
    if (!sw?.clan) return;
    try {
      const data = await getClanMembers(sw.clan);
      clanMembers.value = [
        ...(data.leader  ? [data.leader]  : []),
        ...(data.officer ?? []),
        ...(data.member  ?? []),
      ];
    } catch { clanMembers.value = []; }
  }

  async function openFormationEdit(cat: string) {
    if (formationEditCats.value.includes(cat)) return;
    const battle = currentShadowWar.value?.battle as any;
    formationEditBuffer.value[cat] = JSON.parse(JSON.stringify(battle?.[cat] ?? []));
    formationEditCats.value.push(cat);
    if (!expandedCategories.value.includes(cat)) expandedCategories.value.push(cat);
    await loadClanMembers();
  }

  function cancelFormationEdit(cat: string) {
    formationEditCats.value = formationEditCats.value.filter(c => c !== cat);
    delete formationEditBuffer.value[cat];
  }

  function toggleCategory(cat: string) {
    const idx = expandedCategories.value.indexOf(cat);
    if (idx >= 0) {
      expandedCategories.value.splice(idx, 1);
      cancelFormationEdit(cat);
    } else {
      expandedCategories.value.push(cat);
      openFormationEdit(cat);
    }
  }

  /** Guarda la batalla completa reemplazando la categoría `cat` por su buffer. */
  async function autoSave(cat: string) {
    if (!currentShadowWar.value?._id) return;
    saving.value = true;
    try {
      const raw = (currentShadowWar.value?.battle as any) ?? {};
      const fullBattle: Record<string, any[]> = {};
      for (const c of Object.keys(raw)) {
        fullBattle[c] = c === cat
          ? (formationEditBuffer.value[cat] ?? []).map(cleanMatch)
          : (raw[c] ?? []).map(cleanMatch);
      }
      await updateShadowWarClan(currentShadowWar.value._id, {
        battle:      fullBattle,
        characterId: store.currentCharacter,
      });
      await store.handleGetShadowWar(currentShadowWar.value._id);
      const freshBattle = (currentShadowWar.value?.battle as any);
      if (freshBattle?.[cat]) formationEditBuffer.value[cat] = JSON.parse(JSON.stringify(freshBattle[cat]));
    } finally {
      saving.value = false;
    }
  }

  async function setResult(cat: string, matchIdx: number, result: string) {
    formationEditBuffer.value[cat][matchIdx].result = result;
    await autoSave(cat);
  }

  function openSlotSelection(slot: SWSlotRef) {
    _openSlotSelection(slot);
    showMemberPicker.value = true;
  }

  async function handleMemberSelected(character: any) {
    if (!selectionContext.value) return;
    const { cat, matchIdx, group, memberIndex } = selectionContext.value;
    formationEditBuffer.value[cat][matchIdx][group].character[memberIndex] = character;
    showMemberPicker.value = false;
    selectionContext.value = null;
    await autoSave(cat);
  }

  async function handleMemberUnassigned(characterId: string) {
    const detail = assignedMemberDetails.value[characterId];
    if (!detail) return;
    const { category, matchIndex, group, memberIndex } = detail;
    formationEditBuffer.value[category][matchIndex][group].character[memberIndex] = undefined;
    await autoSave(category);
  }

  async function unassignSlot(slot: SWSlotRef) {
    formationEditBuffer.value[slot.cat][slot.matchIdx][slot.group].character[slot.memberIndex] = undefined;
    await autoSave(slot.cat);
  }

  async function onDrop(slot: SWSlotRef) {
    dragOverKey.value = null;
    if (!dragSource.value) return;
    const src = dragSource.value;
    dragSource.value = null;
    if (slotKey(src) === slotKey(slot)) return;
    const srcChar = getDragChar(src);
    const tgtChar = getDragChar(slot);
    setDragChar(src, tgtChar);
    setDragChar(slot, srcChar);
    await autoSave(slot.cat);
    if (src.cat !== slot.cat) await autoSave(src.cat);
  }

  return {
    expandedCategories, formationEditCats, formationEditBuffer, clanMembers, showMemberPicker,
    toggleCategory, setResult,
    assignedMemberIds, assignedMemberDetails,
    openSlotSelection, handleMemberSelected, handleMemberUnassigned, unassignSlot,
    dragSource, dragOverKey, slotKey, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  };
}
