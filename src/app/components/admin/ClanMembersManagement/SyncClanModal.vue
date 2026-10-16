<script setup lang="ts">
import { ref } from 'vue';
import CustomModal from '../../Modals/CustomModal.vue';
import { syncClanMembers } from '../../../../middlewares/services';

/** Modal: sincroniza los miembros del clan desde un archivo .csv / .xlsx. */
const props = defineProps<{
  clanId: string;
  /** Recarga el clan en el componente padre. */
  reload: () => Promise<void>;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const syncFile    = ref<File | null>(null);
const syncLoading = ref(false);
const syncError   = ref('');
const syncResults = ref<{ name: string; status: string }[]>([]);
const syncRemoved = ref(0);
const syncDone    = ref(false);

function onSyncFileChange(e: Event) {
  syncFile.value  = (e.target as HTMLInputElement).files?.[0] ?? null;
  syncError.value = '';
  syncDone.value  = false;
}

async function handleSync() {
  if (!syncFile.value) return;
  syncLoading.value = true;
  syncError.value   = '';
  syncDone.value    = false;
  try {
    const res = await syncClanMembers(props.clanId, syncFile.value);
    syncResults.value = res.results ?? [];
    syncRemoved.value = res.removed ?? 0;
    syncDone.value    = true;
  } catch (e: any) {
    const data = e?.response?.data;
    syncError.value = data?.message ?? data?.details ?? data?.error ?? 'Error al sincronizar.';
  } finally {
    syncLoading.value = false;
    await props.reload();
  }
}
</script>

<template>
  <CustomModal title="Actualizar clan desde archivo" @close="emit('close')">
    <div class="modal-form">
      <p class="modal-hint">
        El archivo reemplaza los <strong>miembros</strong> del clan. Los personajes del archivo son creados o actualizados; los que no aparezcan pasan a exmiembros (no se borran, quedan en su historial).<br />
        Columnas: <strong>Jugador, Resonancia, Armadura, Penetracion, Potencia, Resistencia, Clase, Whatsapp</strong>.
      </p>
      <div class="hint-attendance">
        <i class="fas fa-calendar-check hint-attendance__icon"></i>
        <p class="hint-attendance__text">
          <strong>Nuevo:</strong> columnas de fecha (<em>28may</em>, <em>4jun</em>…) con valor <strong>1</strong> registran asistencia a la Guerra de Sombras de ese día.
        </p>
      </div>
      <div class="field-group">
        <label class="field-label">Archivo (.csv o .xlsx)</label>
        <input type="file" accept=".csv,.xlsx" class="sync-file-input" @change="onSyncFileChange" :disabled="syncLoading" />
      </div>
      <div class="step-actions">
        <button :disabled="syncLoading || !syncFile" @click="handleSync">
          <i :class="['fas', 'fa-rotate', { 'fa-spin': syncLoading }]"></i>
          {{ syncLoading ? 'Sincronizando...' : 'Sincronizar' }}
        </button>
      </div>
      <div v-if="syncLoading" class="sync-progress-wrap">
        <div class="sync-progress-bar" />
        <span class="sync-progress-label">Procesando archivo, puede tomar unos segundos…</span>
      </div>
      <p v-if="syncError" class="modal-error">{{ syncError }}</p>
      <template v-if="syncDone">
        <p class="modal-hint">
          {{ syncResults.length }} procesados
          <span v-if="syncRemoved > 0"> · {{ syncRemoved }} pasados a exmiembros</span>
        </p>
        <ul class="search-results">
          <li v-for="r in syncResults" :key="r.name" class="search-result-card" style="cursor:default">
            <div class="result-info">
              <div>
                <strong>{{ r.name }}</strong>
                <small>{{ r.status === 'created' ? 'Creado' : 'Actualizado' }}</small>
              </div>
            </div>
          </li>
        </ul>
      </template>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./ClanMemberModals.scss" />
