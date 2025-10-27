<style scoped lang="scss" src="./AddMemberModal.scss" />
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '../../../../middlewares/store';
import { classes } from '../../../../middlewares/misc/const';
import CustomModal from '../../Modals/CustomModal.vue';

const emit = defineEmits(['close']);
const store: any = useStore();

const whatsapp = ref('');
const character = ref('');
const resonance = ref(0);
const selectedClass = ref('');
const sliderContainer = ref<HTMLElement | null>(null);

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

const isCharacterEmpty = computed(() => character.value.trim() === '');

function handleClassSelection(classValue: string) {
  selectedClass.value = classValue;
};

function handleCloseModal() {
  emit('close');
};

function handleSubmit() {
  const formData = {
    character: character.value,
    resonance: resonance.value,
    class: selectedClass.value,
    whatsapp: whatsapp.value,
  };
  store.handleCreateMember(formData);
  handleCloseModal();
};
</script>

<template>
  <CustomModal title="Agregar miembro" @close="$emit('close')">
    <form @submit.prevent="handleSubmit">
      <ul class="d-flex col g-1">
        <span class="d-flex g-1">
          <label for="character">Personaje:</label>
          <input type="text" id="character" v-model="character" required>
        </span>
        <span class="d-flex g-1">
          <label for="resonance">Resonancia:</label>
          <input type="number" id="resonance" v-model.number="resonance" min="0">
        </span>
        <span class="d-flex g-1">
          <label for="whatsapp">WhatsApp:</label>
          <input type="text" id="whatsapp" v-model="whatsapp">
        </span>
        <span class="d-flex col g-1">
          <label>Clase:</label>
          <div class="class-selection-wrapper">
            <button type="button" class="slider-arrow left-arrow" @click="scrollLeft">&lt;</button>
            <div class="class-selection" ref="sliderContainer">
              <button type="button" v-for="cls in classes" :key="cls.value" @click="handleClassSelection(cls.value)"
                :class="{ 'selected-class': selectedClass === cls.value }">
                <img :src="cls.image" :alt="cls.name" width="50" height="50">
                <small>{{ cls.name }}</small>
              </button>
            </div>
            <button type="button" class="slider-arrow right-arrow" @click="scrollRight">&gt;</button>
          </div>
        </span>
        <button type="submit" :disabled="isCharacterEmpty"
          class="submit-button button justify-content-center align-items-center d-flex g-1 w-100">Agregar
          Miembro</button>
      </ul>
    </form>
  </CustomModal>
</template>