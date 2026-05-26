<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from '../../../middlewares/store';
import { getClanInvitations, reviewClanInvitation } from '../../../middlewares/services';
import { classes } from '../../../middlewares/misc/const';

const store: any = useStore();

const invitations = ref<any[]>([]);
const loading = ref(true);
const processingId = ref<string | null>(null);
const actionError = ref('');

const activeCharId = computed(() => store.currentCharacter);

const visibleInvitations = computed(() =>
  invitations.value.filter(inv =>
    inv.character?._id === activeCharId.value ||
    String(inv.character?._id) === String(activeCharId.value)
  )
);

onMounted(async () => {
  store.markNotificationsRead();
  try {
    invitations.value = await getClanInvitations() ?? [];
  } finally {
    loading.value = false;
  }
});

async function review(id: string, action: 'accept' | 'reject') {
  processingId.value = id;
  actionError.value = '';
  try {
    await reviewClanInvitation(id, action);
    invitations.value = invitations.value.filter(inv => inv._id !== id);
  } catch (e: any) {
    actionError.value = e?.response?.data?.message ?? 'Error al procesar la invitación.';
  } finally {
    processingId.value = null;
  }
}

function getClassName(value: string) {
  return classes.find(c => c.value === value)?.name ?? value;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
</script>

<template>
  <div class="inv-wrapper">
    <div class="inv-header">
      <h4 class="inv-subtitle">tu personaje</h4>
      <h2 class="inv-title">Bandeja de entrada</h2>
    </div>

    <div v-if="loading" class="inv-empty">Cargando mensajes...</div>

    <template v-else>
      <section class="inv-section">
        <div class="inv-section-header">
          <i class="fas fa-envelope inv-section-icon"></i>
          <span>Invitaciones de clan</span>
        </div>

        <div v-if="!visibleInvitations.length" class="inv-empty">
          <i class="fas fa-envelope-open"></i>
          <p>Sin invitaciones para este personaje.</p>
        </div>

        <div v-else class="inv-list">
          <div v-for="inv in visibleInvitations" :key="inv._id" class="inv-card">
            <div class="inv-info">
              <div class="inv-main">
                <i class="fas fa-shield-halved inv-clan-icon"></i>
                <div class="inv-names">
                  <span class="inv-clan-name">{{ inv.clan?.name ?? '—' }}</span>
                  <span class="inv-char-name">para <strong>{{ inv.character?.name ?? '—' }}</strong></span>
                </div>
                <span class="inv-role-badge" :class="inv.role">{{ inv.role === 'officer' ? 'Oficial' : 'Miembro' }}</span>
              </div>
              <div class="inv-meta">
                <span v-if="inv.proposedClass">
                  <i class="fas fa-user-shield"></i> {{ getClassName(inv.proposedClass) }}
                </span>
                <span v-if="inv.proposedResonance">
                  <i class="fas fa-bolt"></i> {{ inv.proposedResonance }} res.
                </span>
                <span class="inv-date">{{ formatDate(inv.createdAt) }}</span>
              </div>
            </div>
            <div class="inv-actions">
              <button
                class="inv-btn accept"
                :disabled="processingId === inv._id"
                @click="review(inv._id, 'accept')"
              >
                <i class="fas fa-check"></i> Aceptar
              </button>
              <button
                class="inv-btn reject"
                :disabled="processingId === inv._id"
                @click="review(inv._id, 'reject')"
              >
                <i class="fas fa-times"></i> Rechazar
              </button>
            </div>
          </div>
        </div>
      </section>

      <p v-if="actionError" class="inv-error">{{ actionError }}</p>
    </template>
  </div>
</template>

<style scoped lang="scss">
$gold: rgb(227, 210, 168);
$gold-dim: rgba(227, 210, 168, .12);

.inv-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem 1.5rem;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}

.inv-header {
  display: flex;
  flex-direction: column;
  gap: .3rem;
}

.inv-subtitle {
  font-size: .65rem;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .35);
  margin: 0;
}

.inv-title {
  font-size: 1.4rem;
  margin: 0;
  color: var(--color-app-white);
}

.inv-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.inv-section-header {
  display: flex;
  align-items: center;
  gap: .6rem;
  font-size: .7rem;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .35);
  font-family: 'Cinzel', serif;
  padding-bottom: .5rem;
  border-bottom: 1px solid rgba(255, 255, 255, .06);

  .inv-section-icon { font-size: .8rem; color: rgba(100, 180, 255, .6); }
}

.inv-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .75rem;
  padding: 2rem 0;
  color: rgba(255, 255, 255, .3);
  font-size: .9rem;

  i { font-size: 1.6rem; }
  p { margin: 0; }
}

.inv-list {
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.inv-card {
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

.inv-info {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  flex: 1;
  min-width: 0;
}

.inv-main {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-wrap: wrap;
}

.inv-clan-icon {
  font-size: 1.1rem;
  color: $gold;
  flex-shrink: 0;
}

.inv-names {
  display: flex;
  flex-direction: column;
  gap: .1rem;
  flex: 1;
}

.inv-clan-name {
  font-size: .95rem;
  font-weight: 600;
  color: var(--color-app-white);
  font-family: 'Cinzel', serif;
}

.inv-char-name {
  font-size: .78rem;
  color: rgba(255, 255, 255, .5);

  strong { color: rgba(255, 255, 255, .75); }
}

.inv-role-badge {
  font-size: .62rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  padding: .2rem .6rem;
  border-radius: 4px;
  font-family: 'Cinzel', serif;
  flex-shrink: 0;

  &.officer {
    background: rgba(100, 160, 255, .08);
    border: 1px solid rgba(100, 160, 255, .3);
    color: rgba(100, 180, 255, .9);
  }

  &.member {
    background: $gold-dim;
    border: 1px solid rgba(227, 210, 168, .25);
    color: rgba(227, 210, 168, .85);
  }
}

.inv-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: .78rem;
  color: rgba(255, 255, 255, .45);

  i { margin-right: .3rem; }
}

.inv-date { color: rgba(255, 255, 255, .3); }

.inv-actions {
  display: flex;
  gap: .5rem;
  flex-shrink: 0;
}

.inv-btn {
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

.inv-error {
  margin: 0;
  font-size: .82rem;
  color: #e57373;
  padding: .5rem .75rem;
  background: rgba(229, 115, 115, .08);
  border: 1px solid rgba(229, 115, 115, .3);
  border-radius: 6px;
}
</style>
