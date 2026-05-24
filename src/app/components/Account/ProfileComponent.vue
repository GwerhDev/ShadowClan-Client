<style scoped lang="scss" src="./ProfileComponent.scss" />
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '../../../middlewares/store';
import AddCharacterModal from './AddCharacterModal.vue';
import { classes } from '../../../middlewares/misc/const';

const store: any = useStore();
const showModal = ref(false);

const characters = computed(() => store.currentUser.userData?.character ?? []);

const activeCharacter = computed(() =>
  characters.value.find((c: any) => c._id === store.currentCharacter) ?? characters.value[0] ?? null
);

function selectCharacter(id: string) {
  store.setCurrentCharacter(id);
}

function getClassName(value: string) {
  return classes.find(c => c.value === value)?.name ?? value;
}

function getClassImage(value: string) {
  return classes.find(c => c.value === value)?.image ?? '';
}
</script>

<template>
  <div class="container-settings-component">
    <div class="settings-container">

      <!-- Character list -->
      <div class="character-list">
        <div
          v-for="char in characters"
          :key="char._id"
          :class="['character-tab', { active: char._id === store.currentCharacter }]"
          @click="selectCharacter(char._id)"
        >
          <img
            v-if="char.currentClass"
            :src="getClassImage(char.currentClass)"
            :alt="char.currentClass"
            width="28" height="28"
          />
          <i v-else class="fas fa-user-circle class-placeholder"></i>
          <span>{{ char.name }}</span>
        </div>

        <button class="add-character-btn" @click="showModal = true" title="Vincular personaje">
          <i class="fas fa-plus"></i>
          <span>Vincular personaje</span>
        </button>
      </div>

      <!-- Character detail -->
      <div v-if="activeCharacter" class="character-detail">
        <div class="detail-header">
          <img
            v-if="activeCharacter.currentClass"
            :src="getClassImage(activeCharacter.currentClass)"
            :alt="activeCharacter.currentClass"
            width="56" height="56"
            class="class-image"
          />
          <div class="detail-titles">
            <h4>personaje activo</h4>
            <h1>{{ activeCharacter.name }}</h1>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Clase</span>
            <span class="detail-value featured-text">
              {{ activeCharacter.currentClass ? getClassName(activeCharacter.currentClass) : '—' }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Resonancia</span>
            <span class="detail-value featured-text">
              {{ activeCharacter.resonance ?? '—' }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Clan</span>
            <span class="detail-value featured-text">
              {{ activeCharacter.clan?.name ?? 'Sin clan' }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Estado</span>
            <span class="detail-value featured-text">
              {{ activeCharacter.status ?? '—' }}
            </span>
          </div>
        </div>
      </div>

      <!-- No characters -->
      <div v-else class="no-character">
        <i class="fas fa-user-slash"></i>
        <p>No tienes personajes vinculados.</p>
        <button @click="showModal = true">
          <i class="fas fa-plus"></i> Vincular personaje
        </button>
      </div>

    </div>
  </div>

  <AddCharacterModal v-if="showModal" @close="showModal = false" />
</template>
