<style scoped lang="scss" src="./AddCharacterModal.scss" />
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '../../../middlewares/store';
import { classes } from '../../../middlewares/misc/const';
import { getCharacterByName } from '../../../middlewares/services';
import CustomModal from '../Modals/CustomModal.vue';
import LabeledInput from '../Inputs/LabeledInput.vue';
import CharacterCard from '../Cards/CharacterCard.vue';

const emit = defineEmits(['close']);
const store: any = useStore();
const step = ref(1);
const characterName = ref('');
const characters = ref<any[]>([]);
const selectedCharacter = ref<any>(null);
const isLoading = ref(false);
let debounceTimer: any = null;

function scrollLeft() {
  if (sliderContainer.value) {
    sliderContainer.value.scrollBy({
      left: -200, // Scroll by 200px to the left
      behavior: 'smooth'
    });
  }
}

function scrollRight() {
  if (sliderContainer.value) {
    sliderContainer.value.scrollBy({
      left: 200, // Scroll by 200px to the right
      behavior: 'smooth'
    });
  }
}

const formData = ref({
  name: '',
  clan: '',
  resonance: null,
  currentClass: '',
});

const sliderContainer = ref<HTMLElement | null>(null);

const isCharacterEmpty = computed(() => characterName.value.trim().length < 3);
const isFormEmpty = computed(() => formData.value.name.trim() === '');

function handleClassSelection(classValue: string) {
  formData.value.currentClass = classValue;
};

function handleCloseModal() {
  emit('close');
};

const searchCharacter = async () => {
  if (isCharacterEmpty.value) {
    characters.value = [];
    return;
  }
  isLoading.value = true;
  const response = await getCharacterByName(characterName.value);
  if (response.found) {
    characters.value = response.characters;
  } else {
    characters.value = [];
  }
  isLoading.value = false;
};


const handleNameInput = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    !isCharacterEmpty.value && searchCharacter();
  }, 1000);
};

const selectCharacterToClaim = (character: any) => {
  selectedCharacter.value = character;
  step.value = 2;
};

const goToCreateNewCharacter = () => {
  formData.value.name = characterName.value;
  step.value = 3;
};

async function handleSubmit() {
  const response = await store.handleCreateCharacter(formData.value);
  if (!response?.error) return handleCloseModal();
};

function backToStep1() {
  step.value = 1;
}

function claimCharacter(character: any) {
  console.log('Claiming character:', character);
  // Logic to claim the character will be added here
}

</script>

<template>
  <CustomModal title="Agregar personaje" @close="$emit('close')">
    <div class="search-character-container" v-if="step === 1">
      <LabeledInput label="Nombre del Personaje" id="name" v-model="characterName" @input="handleNameInput" required />
      <div v-if="isLoading">Buscando...</div>
      <ul class="character-card-container">
        <li v-for="char in characters" :key="char.id" @click="selectCharacterToClaim(char)">
          <CharacterCard :character="char" />
        </li>
      </ul>
      <button :disabled="isCharacterEmpty" @click="goToCreateNewCharacter">Crear Nuevo Personaje</button>
    </div>

    <div v-if="step === 2" class="search-character-container">
      <ul class="character-card-container">
        <li>
          <CharacterCard :character="selectedCharacter" />
        </li>
      </ul>
      <button @click="claimCharacter(selectedCharacter)" type="submit"
        class="submit-button button justify-content-center align-items-center d-flex g-1 w-100">
        <i class="fas fa-link"></i>
        Confirmar Reclamo</button>
      <button class="secondary-button" type="button" @click="backToStep1">Volver</button>
    </div>

    <form v-if="step === 3" @submit.prevent="handleSubmit">
      <ul class="d-flex col g-1">
        <LabeledInput label="Nombre" id="name" v-model="formData.name" required disabled />

        <LabeledInput label="Resonancia" id="resonance" v-model.number="formData.resonance" type="number" />

        <LabeledInput label="Clan" id="clan" v-model="formData.clan" type="text" />

        <span class="class-selector-container">
          <label>Clase:</label>
          <div class="class-selection-wrapper">
            <button type="button" class="slider-arrow left-arrow" @click="scrollLeft">&lt;</button>
            <div class="class-selection" ref="sliderContainer">
              <button type="button" v-for="cls in classes" :key="cls.value" @click="handleClassSelection(cls.value)"
                :class="{ 'selected-class': formData.currentClass === cls.value }">
                <img :src="cls.image" :alt="cls.name" width="50" height="50">
                <small>{{ cls.name }}</small>
              </button>
            </div>
            <button type="button" class="slider-arrow right-arrow" @click="scrollRight">&gt;</button>
          </div>
        </span>
        <button :disabled="isFormEmpty" type="submit"
          class="submit-button button justify-content-center align-items-center d-flex g-1 w-100">
          <i class="fas fa-link"></i>
          Vincular a tu cuenta</button>
        <button class="secondary-button" type="button" @click="backToStep1">Volver</button>
      </ul>
    </form>
  </CustomModal>
</template>
