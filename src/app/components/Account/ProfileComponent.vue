<style scoped lang="scss" src="./ProfileComponent.scss" />
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '../../../middlewares/store';
import AddCharacterModal from './AddCharacterModal.vue';
import LinkCharacterForm from '../Walker/LinkCharacterForm.vue';
import { classes } from '../../../middlewares/misc/const';
import { updateCharacter } from '../../../middlewares/services';

const store: any = useStore();
const showAddModal = ref(false);
const linkingCharacter = ref(false);
const showCharSwitcher = ref(false);
const switchLoading = ref(false);

const characters = computed(() => store.currentUser.userData?.character ?? []);

const activeCharacter = computed(() =>
  characters.value.find((c: any) => c._id === store.currentCharacter) ?? characters.value[0] ?? null
);

const activeCharacterRole = computed(() => {
  const clan = activeCharacter.value?.clan;
  if (!clan) return null;
  const charId = String(activeCharacter.value._id);
  if (String(clan.leader) === charId) return 'Líder';
  if ((clan.officer ?? []).some((o: any) => String(o._id ?? o) === charId)) return 'Oficial';
  if ((clan.member ?? []).some((m: any) => String(m._id ?? m) === charId)) return 'Miembro';
  return null;
});

const clanMemberCount = computed(() => {
  const clan = activeCharacter.value?.clan;
  if (!clan) return 0;
  return 1 + (clan.officer?.length ?? 0) + (clan.member?.length ?? 0);
});

async function switchCharacter(id: string) {
  if (id === store.currentCharacter) { showCharSwitcher.value = false; return; }
  switchLoading.value = true;
  store.setCurrentCharacter(id);
  try {
    await store.handleGetCharacter();
  } finally {
    switchLoading.value = false;
    showCharSwitcher.value = false;
  }
}

const editing = ref(false);
const editSaving = ref(false);
const editError = ref('');
const editForm = ref({ name: '', currentClass: '', resonance: null as number | null });

function startEdit() {
  const c = activeCharacter.value;
  editForm.value = {
    name: c.name ?? '',
    currentClass: c.currentClass ?? '',
    resonance: c.resonance ?? null,
  };
  editError.value = '';
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
  editError.value = '';
}

async function saveEdit() {
  if (!activeCharacter.value) return;
  editSaving.value = true;
  editError.value = '';
  try {
    const payload: any = {
      name: editForm.value.name.trim(),
      currentClass: editForm.value.currentClass || undefined,
      resonance: editForm.value.resonance ?? undefined,
    };
    await updateCharacter(activeCharacter.value._id, payload);
    await store.handleGetCharacter();
    editing.value = false;
  } catch {
    editError.value = 'Error al guardar los cambios.';
  } finally {
    editSaving.value = false;
  }
}

function getClassName(value: string) {
  return classes.find(c => c.value === value)?.name ?? value;
}

function getClassImage(value: string) {
  return classes.find(c => c.value === value)?.image ?? '';
}

function charHasUnreadNotifications(char: any): boolean {
  return store.notifications.some((n: any) =>
    !n.read && n.targetType === 'character' && n.targetId === String(char._id)
  );
}
</script>

<template>
  <div class="settings-container">

    <!-- No characters -->
    <div v-if="!characters.length" class="no-character-card">
      <template v-if="!linkingCharacter">
        <i class="fa-solid fa-user-slash no-char-icon"></i>
        <h2>Sin personaje vinculado</h2>
        <p class="no-char-desc">Necesitas vincular al menos un personaje para acceder a las funciones del clan.</p>
        <button @click="linkingCharacter = true">
          <i class="fas fa-plus"></i>
          Vincular personaje
        </button>
      </template>
      <LinkCharacterForm v-else @done="linkingCharacter = false" @cancel="linkingCharacter = false" />
    </div>

    <!-- Has characters -->
    <template v-else>
      <div v-if="activeCharacter" class="character-detail">
        <!-- Header with switcher -->
        <div class="detail-header">
          <img
            v-if="editing ? !!editForm.currentClass : !!activeCharacter.currentClass"
            :src="getClassImage(editing ? editForm.currentClass : activeCharacter.currentClass)"
            :alt="activeCharacter.currentClass" width="56" height="56" class="class-image"
          />
          <div class="detail-titles">
            <h4>personaje activo</h4>
            <div class="char-name-row">
              <h1 v-if="!editing">{{ activeCharacter.name }}</h1>
              <input
                v-else
                type="text"
                class="name-edit-input"
                v-model="editForm.name"
                :disabled="editSaving"
                required
              />
              <button
                class="char-switch-btn"
                :title="switchLoading ? 'Cambiando...' : 'Cambiar personaje'"
                :disabled="switchLoading || editing"
                @click="showCharSwitcher = true"
              >
                <i v-if="switchLoading" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-right-left"></i>
                <span>Cambiar</span>
              </button>
              <button v-if="!editing" class="char-switch-btn" title="Editar personaje" @click="startEdit">
                <i class="fas fa-pen"></i>
                <span>Editar</span>
              </button>
              <button v-else class="char-switch-btn char-switch-btn--save" title="Guardar" :disabled="editSaving" @click="saveEdit">
                <i v-if="editSaving" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-check"></i>
              </button>
              <button v-if="editing" class="char-switch-btn" title="Cancelar" :disabled="editSaving" @click="cancelEdit">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Stat grid: Clase + Resonancia -->
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Clase</span>
            <span v-if="!editing" class="detail-value featured-text">
              {{ activeCharacter.currentClass ? getClassName(activeCharacter.currentClass) : '—' }}
            </span>
            <select v-else class="detail-value detail-edit-select" v-model="editForm.currentClass" :disabled="editSaving">
              <option value="">—</option>
              <option v-for="c in classes" :key="c.value" :value="c.value">{{ c.name }}</option>
            </select>
          </div>
          <div class="detail-item">
            <span class="detail-label">Resonancia</span>
            <span v-if="!editing" class="detail-value featured-text">
              {{ activeCharacter.resonance ?? '—' }}
            </span>
            <input v-else type="number" class="detail-value detail-edit-input" v-model.number="editForm.resonance" :disabled="editSaving" min="0" />
          </div>
        </div>
        <p v-if="editError" class="edit-error">{{ editError }}</p>

        <!-- Clan section -->
        <div v-if="activeCharacter.clan" class="clan-card">
          <div class="clan-card-header">
            <i class="fas fa-shield-halved clan-shield-icon"></i>
            <div class="clan-card-titles">
              <span class="clan-card-label">clan</span>
              <h2 class="clan-card-name">{{ activeCharacter.clan.name }}</h2>
            </div>
            <span class="clan-role-badge">{{ activeCharacterRole ?? '—' }}</span>
          </div>
          <div class="clan-card-stats">
            <div class="clan-stat-item">
              <span class="clan-stat-value">{{ clanMemberCount }}</span>
              <span class="clan-stat-label">Miembros</span>
            </div>
            <div class="clan-stat-item">
              <span class="clan-stat-value">{{ activeCharacter.clan.officer?.length ?? 0 }}</span>
              <span class="clan-stat-label">Oficiales</span>
            </div>
          </div>
        </div>
        <div v-else class="no-clan-card">
          <i class="fas fa-shield-halved"></i>
          <span>Sin clan asignado</span>
        </div>
      </div>
    </template>
  </div>

  <!-- Character switcher modal -->
  <div v-if="showCharSwitcher" class="char-switcher-overlay" @click.self="showCharSwitcher = false">
    <div class="char-switcher-modal">
      <div class="char-switcher-header">
        <span>Cambiar personaje</span>
        <button class="char-switcher-close" @click="showCharSwitcher = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <ul class="char-switcher-list">
        <li
          v-for="char in characters"
          :key="char._id"
          :class="['char-switcher-item', { active: char._id === store.currentCharacter }]"
          @click="switchCharacter(char._id)"
        >
          <img v-if="char.currentClass && getClassImage(char.currentClass)"
            :src="getClassImage(char.currentClass)" :alt="char.currentClass" width="28" height="28" />
          <i v-else class="fas fa-user-circle char-sw-placeholder"></i>
          <div class="char-sw-info">
            <strong>{{ char.name }}</strong>
            <small>{{ char.currentClass ? getClassName(char.currentClass) : 'Sin clase' }} · {{ char.resonance ?? '—' }} res.</small>
          </div>
          <div class="char-sw-indicators">
            <i v-if="char.clan" class="fas fa-shield-halved char-sw-clan-icon" title="En clan"></i>
            <i v-if="charHasUnreadNotifications(char)" class="fas fa-bell char-sw-notif-icon" title="Notificaciones pendientes"></i>
          </div>
          <i v-if="char._id === store.currentCharacter" class="fas fa-check char-sw-active-icon"></i>
        </li>
      </ul>
      <button class="char-switcher-add" @click="showCharSwitcher = false; showAddModal = true">
        <i class="fas fa-plus"></i>
        Vincular personaje
      </button>
    </div>
  </div>

  <AddCharacterModal v-if="showAddModal" @close="showAddModal = false" />
</template>
