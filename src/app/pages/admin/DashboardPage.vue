<script setup lang="ts">
import { useRoute } from 'vue-router';
import { onMounted, ref, watch } from 'vue';
import { useStore } from '../../../middlewares/store';
import AppLayout from '../../layouts/AppLayout.vue';
import DeniedAccess from '../../utils/DeniedAccess.vue';
import { ShadowWar as ShadowWarInterface, Match, Character } from '../../../interfaces';
import CustomModal from '../../components/Modals/CustomModal.vue';

const store: any = useStore();
const nextWarDate = ref('');
const warTime = ref('');
const enemyClanName = ref('');
const loading = ref(true);
const copied = ref(false);
const isShareModalOpen = ref(false);
const shareableMessage = ref('');

const route = useRoute();

const tabs = [
  { id: 'shadow-war', name: 'Guerra', icon: 'fas fa-khanda', path: '/a/dashboard/shadow-war' },
  { id: 'accursed-tower', name: 'Torre', icon: 'fas fa-chess-rook', path: '/a/dashboard/accursed-tower' },
  { id: 'history', name: 'Historial', icon: 'fas fa-history', path: '/a/dashboard/history' },
  { id: 'clans', name: 'Clanes', icon: 'fas fa-shield-alt', path: '/a/dashboard/clans' },
  { id: 'characters', name: 'Persojanes', icon: 'fas fa-user-group', path: '/a/dashboard/characters' },
  { id: 'users', name: 'Usuarios', icon: 'fas fa-users', path: '/a/dashboard/users' },
];

const prepareShareableMessage = async () => {
  const warData = store.currentUser.shadowWarData as ShadowWarInterface;
  if (!warData) return;

  const enemy = warData.enemyClan?.name || 'Clan enemigo no definido';

  const formatGroup = (group: (Character | undefined)[]) => {
    return group
      .map(c => c?.name || 'Vacío')
      .join(', ');
  };

  const formatMatches = (title: string, matches: Match[]) => {
    if (!matches || matches.length === 0) return '';
    let section = `*${title.toUpperCase()}*\n\n`;
    matches.forEach((match, index) => {
      section += `*PARTIDA ${index + 1}*\n`;
      section += `_grupo 1:_ ${formatGroup(match.group1.character)}\n`;
      section += `_grupo 2:_ ${formatGroup(match.group2.character)}\n\n`;
    });
    return section + '\n';
  };

  let lineupText = '*ALINEACIÓN*\n\n';
  lineupText += formatMatches('Batalla Sublime', warData.battle.exalted);
  lineupText += formatMatches('Batalla Eminente', warData.battle.eminent);
  lineupText += formatMatches('Batalla Célebre', warData.battle.famed);
  lineupText += formatMatches('Batalla Imponente', warData.battle.proud);

  const message = `*GUERRA SOMBRÍA*\n\nHoy a las _19:30 h (server)_ nos enfrentaremos al Clan *${enemy}*\n\n_Junto a los Oficiales hemos determinado la alineación que llevaremos, basados en la Encuesta de participación hecha mediante el canal general de nuestro clan._\n\n${lineupText}\n\n*PUEDEN VER LA ALINEACIÓN EN EL SIGUIENTE LINK*\n\n_(*) Los que no confirmaron y lleguen a la guerra, pueden ir rellenando los grupos donde falte gente_\n\nhttps://shadowclan.netlify.app/shadow-war`;

  shareableMessage.value = message.replace(/\n/g, '\n');
};

const copyPreparedMessage = async () => {
  try {
    await navigator.clipboard.writeText(shareableMessage.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2500);
  } catch (err) {
    console.error('Error al copiar el mensaje: ', err);
  }
};

const openShareModalHandler = async () => {
  await prepareShareableMessage();
  isShareModalOpen.value = true;
};

const closeShareModal = () => {
  isShareModalOpen.value = false;
};

onMounted(async () => {
  await store.handleGetNextShadowWar();
  if (store.currentUser.shadowWarData && store.currentUser.shadowWarData.date) {
    const warDate = new Date(store.currentUser.shadowWarData.date);
    nextWarDate.value = warDate.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    warTime.value = warDate.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' });

    if (store.currentUser.shadowWarData.enemyClan) {
      enemyClanName.value = store.currentUser.shadowWarData.enemyClan.name;
    } else {
      enemyClanName.value = 'aun no está definido';
    }
    loading.value = false;
  } else {
    loading.value = false;
  }
});

watch(() => store.currentUser.shadowWarData, (newVal) => {
  if (newVal && newVal.date) {
    const warDate = new Date(newVal.date);
    nextWarDate.value = warDate.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    warTime.value = warDate.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' });

    if (newVal.enemyClan) {
      enemyClanName.value = newVal.enemyClan.name;
    }
  } else {
    nextWarDate.value = '';
    warTime.value = '';
    enemyClanName.value = '';
  }
}, { immediate: true });
</script>

<template>
  <main class="red-shadow-fx" v-if="store.currentUser?.logged">
    <div class="div-container">
      <AppLayout :logged="store.currentUser.logged" :loading="loading" :tabs="tabs"
        :active-layout-tab="route.path" title="Guerra Sombría">
        <router-view :openShareModal="openShareModalHandler" :nextWarDate="nextWarDate" :warTime="warTime"
          :enemyClanName="enemyClanName" />
      </AppLayout>
    </div>
    <CustomModal v-if="isShareModalOpen" @close="closeShareModal" title="Compartir Alineación">
      <div class="share-content">
        <pre class="shareable-message">{{ shareableMessage }}</pre>
        <button @click="copyPreparedMessage" class="copy-button">
          <i class="fas fa-copy"></i> Copiar Mensaje
        </button>
        <span v-if="copied" class="copied-feedback">¡Mensaje copiado!</span>
      </div>
    </CustomModal>
  </main>
  <div v-else class="div-container-denied">
    <DeniedAccess />
  </div>
</template>

<style scoped>
.div-container-denied {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.div-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.shareable-message {
  white-space: pre-wrap;
  background-color: #111;
  padding: 1rem;
  border-radius: 5px;
  max-height: 400px;
  overflow-y: auto;
  font-family: monospace;
}

.copy-button {
  background-color: #4CAF50;
  color: var(--color-app-white);
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.copy-button:hover {
  background-color: #45a049;
}

.copied-feedback {
  color: #4CAF50;
  text-align: center;
}

@media (max-width: 1100px) {
  .div-container {
    padding: 0;
  }
}
</style>