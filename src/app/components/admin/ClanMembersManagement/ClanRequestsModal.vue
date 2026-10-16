<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CustomModal from '../../Modals/CustomModal.vue';
import { useStore } from '../../../../middlewares/store';
import { getClanRequestsManagement, reviewClanRequest } from '../../../../middlewares/services';
import { getClassImage, getClassName, clanHistorySummary } from './memberDisplay';

/** Modal: solicitudes de ingreso al clan del personaje activo. */
const props = defineProps<{
  /** Personaje activo (el backend filtra por su clan). */
  characterId: string | undefined;
  /** Recarga el clan en el componente padre. */
  reload: () => Promise<void>;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const store = useStore();

const clanRequests    = ref<any[]>([]);
const requestsLoading = ref(true);
const requestsError   = ref('');
const reviewingId     = ref<string | null>(null);

onMounted(async () => {
  requestsLoading.value = true;
  requestsError.value   = '';
  try {
    clanRequests.value = await getClanRequestsManagement(props.characterId);
  } catch {
    requestsError.value = 'Error al cargar las solicitudes.';
  } finally {
    requestsLoading.value = false;
  }
});

async function handleReviewRequest(id: string, action: 'accept' | 'reject') {
  reviewingId.value = id;
  requestsError.value = '';
  try {
    await reviewClanRequest(id, action);
    clanRequests.value = clanRequests.value.filter(r => r._id !== id);
    if (store.pendingRequestsCount > 0) store.pendingRequestsCount--;
    await props.reload();
  } catch {
    requestsError.value = 'Error al procesar la solicitud.';
  } finally {
    reviewingId.value = null;
  }
}
</script>

<template>
  <CustomModal title="Solicitudes de ingreso" @close="emit('close')">
    <div class="modal-form">
      <p v-if="requestsLoading" class="modal-hint">Cargando solicitudes...</p>
      <p v-else-if="requestsError" class="modal-error">{{ requestsError }}</p>
      <p v-else-if="!clanRequests.length" class="modal-hint">No hay solicitudes pendientes.</p>
      <div v-for="req in clanRequests" :key="req._id" class="request-card">
        <div class="inv-char">
          <img v-if="req.character?.currentClass && getClassImage(req.character.currentClass)"
            :src="getClassImage(req.character.currentClass)"
            :alt="getClassName(req.character.currentClass)"
            width="28" />
          <i v-else class="fas fa-user-circle inv-placeholder"></i>
          <div class="inv-info">
            <strong>{{ req.character?.name ?? '—' }}</strong>
            <small>{{ req.user?.battletag ?? '—' }} · {{ req.character?.currentClass ? getClassName(req.character.currentClass) : 'Sin clase' }} · {{ req.character?.resonance ?? '—' }} res.</small>
            <small v-if="clanHistorySummary(req.character)" class="history-hint">{{ clanHistorySummary(req.character) }}</small>
          </div>
        </div>
        <div class="request-actions">
          <button
            class="btn-accept"
            :disabled="reviewingId === req._id"
            @click="handleReviewRequest(req._id, 'accept')"
          ><i class="fas fa-check"></i></button>
          <button
            class="btn-reject"
            :disabled="reviewingId === req._id"
            @click="handleReviewRequest(req._id, 'reject')"
          ><i class="fas fa-times"></i></button>
        </div>
      </div>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./ClanMemberModals.scss" />
