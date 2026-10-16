import { ref, Ref } from 'vue';
import { saveClanRoster } from '../../middlewares/services';
import type { AlignmentSlot, RosterType, SavedAlignments } from '../../interfaces';

/**
 * Gestión de plantillas de formación guardadas en el clan ("última" + hasta 3 personalizadas).
 * Compartido por los formularios de Guerra Sombría y Torre Maldita.
 *
 * @param type      Tipo de roster en el backend.
 * @param clanId    Clan del personaje activo.
 * @param buildData Serializa la formación actual a IDs.
 * @param canSave   Condición adicional para guardar (p. ej. que haya una instancia expandida).
 */
export function useSavedAlignments(
  type: RosterType,
  clanId: Ref<string | null>,
  buildData: () => any,
  canSave: () => boolean = () => true,
) {
  const savedAlignments     = ref<SavedAlignments>({ last: null, custom: [] });
  const savingAlignment     = ref(false);
  const showSaveCustomModal = ref(false);

  /** Carga las plantillas desde la respuesta de getClanMembers. */
  function loadSavedAlignments(saved: Partial<SavedAlignments> | undefined | null) {
    if (!saved) return;
    savedAlignments.value = {
      last:   saved.last   ?? null,
      custom: saved.custom ?? [],
    };
  }

  async function saveLastAlignment() {
    if (!clanId.value || !canSave()) return;
    savingAlignment.value = true;
    try {
      const data = buildData();
      await saveClanRoster(clanId.value, { type, slot: 'last', data });
      savedAlignments.value.last = data;
    } finally {
      savingAlignment.value = false;
    }
  }

  function openSaveCustomModal() {
    showSaveCustomModal.value = true;
  }

  async function confirmSaveCustom(name: string, overwriteIdx: number | null) {
    const trimmed = name.trim();
    if (!clanId.value || !trimmed) return;
    const isFull = savedAlignments.value.custom.length >= 3;
    if (isFull && overwriteIdx === null) return;
    savingAlignment.value = true;
    try {
      const data = buildData();
      await saveClanRoster(clanId.value, {
        type, slot: 'custom',
        name: trimmed,
        customIndex: isFull ? overwriteIdx : undefined,
        data,
      });
      const entry: AlignmentSlot = { name: trimmed, data };
      if (isFull && overwriteIdx !== null) savedAlignments.value.custom[overwriteIdx] = entry;
      else savedAlignments.value.custom.push(entry);
      showSaveCustomModal.value = false;
    } finally {
      savingAlignment.value = false;
    }
  }

  async function deleteCustomAlignment(index: number) {
    if (!clanId.value) return;
    await saveClanRoster(clanId.value, { type, slot: 'custom', action: 'delete', customIndex: index });
    savedAlignments.value.custom.splice(index, 1);
  }

  async function renameCustomAlignment(index: number, newName: string) {
    if (!clanId.value || !newName.trim()) return;
    const entry = savedAlignments.value.custom[index];
    await saveClanRoster(clanId.value, { type, slot: 'custom', name: newName.trim(), customIndex: index, data: entry.data });
    savedAlignments.value.custom[index] = { ...entry, name: newName.trim() };
  }

  return {
    savedAlignments, savingAlignment, showSaveCustomModal,
    loadSavedAlignments, saveLastAlignment, openSaveCustomModal,
    confirmSaveCustom, deleteCustomAlignment, renameCustomAlignment,
  };
}
