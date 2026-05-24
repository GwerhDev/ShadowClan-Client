<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStore } from '../../../middlewares/store';

const store: any = useStore();

const requests = ref<any[]>([]);
const loading = ref(true);
const actionError = ref('');
const processingId = ref<string | null>(null);

onMounted(async () => {
  store.markNotificationsRead();
  requests.value = await store.handleGetClanRequestsManagement() ?? [];
  loading.value = false;
});

async function review(id: string, action: 'accept' | 'reject') {
  processingId.value = id;
  actionError.value = '';
  try {
    await store.handleReviewClanRequest(id, action);
    requests.value = requests.value.filter(r => r._id !== id);
  } catch (e: any) {
    actionError.value = e?.response?.data?.message ?? 'Error al procesar la solicitud.';
  } finally {
    processingId.value = null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
</script>

<template>
  <div class="cr-wrapper">
    <div class="cr-header">
      <h4 class="cr-subtitle">gestión de clan</h4>
      <h2 class="cr-title">Solicitudes de ingreso</h2>
    </div>

    <div v-if="loading" class="cr-empty">Cargando solicitudes...</div>

    <div v-else-if="!requests.length" class="cr-empty">
      <i class="fas fa-inbox"></i>
      <p>No hay solicitudes pendientes.</p>
    </div>

    <div v-else class="cr-list">
      <div
        v-for="req in requests"
        :key="req._id"
        class="cr-card"
      >
        <div class="cr-info">
          <div class="cr-char">
            <i class="fas fa-shield-halved"></i>
            <span class="cr-char-name">{{ req.character?.name ?? '—' }}</span>
            <span class="cr-class">{{ req.character?.currentClass ?? '' }}</span>
            <span class="cr-resonance" v-if="req.character?.resonance">
              <i class="fas fa-bolt"></i> {{ req.character.resonance }}
            </span>
          </div>
          <div class="cr-meta">
            <span class="cr-battletag">
              <i class="fas fa-user"></i> {{ req.user?.battletag ?? '—' }}
            </span>
            <span class="cr-clan">
              <i class="fas fa-flag"></i> {{ req.clan?.name ?? '—' }}
            </span>
            <span class="cr-date">{{ formatDate(req.createdAt) }}</span>
          </div>
        </div>
        <div class="cr-actions">
          <button
            class="cr-btn accept"
            :disabled="processingId === req._id"
            @click="review(req._id, 'accept')"
          >
            <i class="fas fa-check"></i> Aceptar
          </button>
          <button
            class="cr-btn reject"
            :disabled="processingId === req._id"
            @click="review(req._id, 'reject')"
          >
            <i class="fas fa-times"></i> Rechazar
          </button>
        </div>
      </div>

      <p v-if="actionError" class="cr-error">{{ actionError }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
$gold: rgb(227, 210, 168);
$gold-mid: rgba(227, 210, 168, .5);
$gold-dim: rgba(227, 210, 168, .12);

.cr-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem 1.5rem;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}

.cr-header {
  display: flex;
  flex-direction: column;
  gap: .3rem;
}

.cr-subtitle {
  font-size: .65rem;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .35);
  margin: 0;
}

.cr-title {
  font-size: 1.4rem;
  margin: 0;
  color: var(--color-app-white);
}

.cr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .75rem;
  padding: 3rem 0;
  color: rgba(255, 255, 255, .35);
  font-size: .9rem;

  i { font-size: 1.8rem; }
  p { margin: 0; }
}

.cr-list {
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.cr-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, .03);
  border: 1px solid $gold-dim;
  border-radius: 8px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.cr-info {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  flex: 1;
  min-width: 0;
}

.cr-char {
  display: flex;
  align-items: center;
  gap: .6rem;
  flex-wrap: wrap;

  i { color: $gold; }
}

.cr-char-name {
  font-size: .95rem;
  font-weight: 600;
  color: var(--color-app-white);
}

.cr-class {
  font-size: .75rem;
  color: rgba(255, 255, 255, .45);
  text-transform: capitalize;
}

.cr-resonance {
  font-size: .75rem;
  color: $gold;

  i { font-size: .65rem; }
}

.cr-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: .78rem;
  color: rgba(255, 255, 255, .45);

  i { margin-right: .3rem; }
}

.cr-battletag { color: rgba(255, 255, 255, .6); }

.cr-actions {
  display: flex;
  gap: .5rem;
  flex-shrink: 0;
}

.cr-btn {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .45rem 1rem;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-size: .75rem;
  letter-spacing: .04em;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background .2s, border-color .2s;

  &:disabled { opacity: .4; cursor: not-allowed; }

  &.accept {
    background: transparent;
    border-color: rgba(129, 199, 132, .4);
    color: #81c784;
    &:hover:not(:disabled) { background: rgba(129, 199, 132, .08); border-color: #81c784; }
  }

  &.reject {
    background: transparent;
    border-color: rgba(229, 115, 115, .4);
    color: #e57373;
    &:hover:not(:disabled) { background: rgba(229, 115, 115, .08); border-color: #e57373; }
  }
}

.cr-error {
  margin: 0;
  font-size: .82rem;
  color: #e57373;
  padding: .5rem .75rem;
  background: rgba(229, 115, 115, .08);
  border: 1px solid rgba(229, 115, 115, .3);
  border-radius: 6px;
}
</style>
