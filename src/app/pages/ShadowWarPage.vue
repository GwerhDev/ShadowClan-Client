<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from '../../middlewares/store';
import AppLayout from '../layouts/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useRoute, useRouter } from 'vue-router';
import UnclaimedClanNotice from '../components/common/UnclaimedClanNotice.vue';

const store: any = useStore();
const nextWarDate    = ref('');
const enemyClanName  = ref('');
const loading        = ref(true);
const route          = useRoute();
const router         = useRouter();

const shadowWarData = computed(() => store.currentUser.shadowWarData);

const activeCharacter = computed(() => {
  const chars = store.currentUser.userData?.character ?? [];
  return (chars as any[]).find((c: any) => c._id === store.currentCharacter) ?? chars[0] ?? null;
});
const activeClan = computed(() => activeCharacter.value?.clan ?? null);
const clanUnclaimed = computed(() => activeClan.value?.status === 'unclaimed');


const tabs = computed(() => {
  if (!shadowWarData.value) return [];
  return [
    { id: 'exalted', name: 'Sublime',   icon: 'fas fa-crown',       path: '/shadow-war/exalted' },
    { id: 'eminent', name: 'Eminente',  icon: 'fas fa-trophy',      path: '/shadow-war/eminent' },
    { id: 'famed',   name: 'Célebre',   icon: 'fas fa-medal',       path: '/shadow-war/famed'   },
    { id: 'proud',   name: 'Imponente', icon: 'fas fa-fist-raised',  path: '/shadow-war/proud'  },
  ];
});

onMounted(async () => {
  loading.value = true;
  try {
    await store.handleGetNextShadowWar();
    // Redirigir a la primera pestaña solo si hay una instancia activa y
    // el usuario llegó a la raíz /shadow-war (sin subruta)
    if (store.currentUser.shadowWarData && route.path === '/shadow-war') {
      router.replace('/shadow-war/exalted');
    }
  } finally {
    loading.value = false;
  }
});

watch(shadowWarData, (newVal) => {
  if (newVal?.date) {
    const warDate = new Date(newVal.date);
    nextWarDate.value   = warDate.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    enemyClanName.value = newVal.enemyClan?.name ?? 'aún no está definido';
  } else {
    nextWarDate.value   = '';
    enemyClanName.value = '';
  }
}, { immediate: true });
</script>

<template>
  <main class="red-shadow-fx">
    <AppLayout :loading="loading" :tabs="tabs" :active-layout-tab="route.path">

      <EmptyState
        v-if="loading"
        icon="fas fa-spinner fa-spin"
        message="Cargando..."
      />

      <!-- Clan unclaimed notice -->
      <UnclaimedClanNotice
        v-else-if="clanUnclaimed"
        :character-id="activeCharacter?._id"
        :clan-id="activeClan?._id ?? activeClan"
        :clan-name="activeClan?.name ?? ''"
      />

      <EmptyState
        v-else-if="!shadowWarData"
        icon="fas fa-shield-alt"
        message="No hay una Guerra Sombría programada esta semana."
      />

      <template v-else>
        <div class="sw-info">
          <p>La próxima <b>Guerra Sombría</b> es el <i>{{ nextWarDate }} a las 19:30h (hora del servidor)</i>. Enfrentaremos al Clan:</p>
          <h4 class="sw-clan-name">{{ enemyClanName }}</h4>
        </div>
        <router-view :loading="loading" />
      </template>

    </AppLayout>
  </main>
</template>

<style scoped lang="scss">

.sw-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-inline: 1rem;
  text-align: center;
}

.sw-clan-name {
  font-size: 2rem;
}

/* styles moved to UnclaimedClanNotice.vue */
/* .unclaimed-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2.5rem 1.5rem;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;

  h2 { margin: 0; font-size: 1.4rem; }
  p  { margin: 0; color: rgba(255,255,255,.55); font-size: .9rem; line-height: 1.65; }
  strong { color: $gold; }
}

.unclaimed-icon {
  font-size: 2.5rem;
  color: rgba(227, 210, 168, .5);
  filter: drop-shadow(0 0 12px rgba(227,210,168,.2));
}

.unclaimed-pending {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .9rem 1.25rem;
  background: $gold-dim;
  border: 1px solid rgba(227,210,168,.2);
  border-radius: 8px;
  font-size: .85rem;
  color: rgba(255,255,255,.6);
  text-align: left;
  i { color: $gold; flex-shrink: 0; }
  strong { color: $gold; }
}

.unclaimed-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.unclaimed-label {
  font-size: .65rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(255,255,255,.35);
}

.unclaimed-role-group {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.unclaimed-role-btns {
  display: flex;
  gap: .5rem;
}

.role-opt {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  padding: .55rem 1rem;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,.12);
  background: transparent;
  color: rgba(255,255,255,.5);
  font-size: .82rem;
  cursor: pointer;
  transition: all .15s;

  &:hover { border-color: rgba(255,255,255,.25); color: rgba(255,255,255,.8); }
  &.active {
    background: $gold-dim;
    border-color: rgba(227,210,168,.35);
    color: $gold;
  }
}

.unclaimed-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .55rem 1.2rem;
  border-radius: 6px;
  border: 1px solid rgba(227,210,168,.4);
  background: transparent;
  color: $gold;
  font-family: 'Cinzel', serif;
  font-size: .8rem;
  cursor: pointer;
  transition: background .2s;
  &:hover:not(:disabled) { background: $gold-dim; }
  &:disabled { opacity: .4; cursor: not-allowed; }
}

.unclaimed-feedback {
  margin: 0;
  font-size: .82rem;
} */
</style>
