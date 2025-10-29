<style scoped lang="scss" src="./AddCharacterModal.scss" />
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '../../../middlewares/store';
import { classes } from '../../../middlewares/misc/const';
import CustomModal from '../Modals/CustomModal.vue';
import LabeledInput from '../Inputs/LabeledInput.vue';

const emit = defineEmits(['close']);
const store: any = useStore();

const formData = ref({
  name: '',
  clan: '',
  resonance: null,
  currentClass: '',
});

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

const isCharacterEmpty = computed(() => formData.value.name.trim() === '');

function handleClassSelection(classValue: string) {
  formData.value.currentClass = classValue;
};

function handleCloseModal() {
  emit('close');
};

function handleSubmit() {
  console.log(formData.value)
  store.handleCreateCharacter(formData.value);
  handleCloseModal();
};
</script>

<template>
  <CustomModal title="Agregar personaje" @close="$emit('close')">
    <form @submit.prevent="handleSubmit">
      <ul class="d-flex col g-1">
        <LabeledInput label="Nombre" id="name" v-model="formData.name" required />

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
        <button :disabled="isCharacterEmpty" type="submit"
          class="submit-button button justify-content-center align-items-center d-flex g-1 w-100">
          <i class="fas fa-link"></i>
          Vincular a tu cuenta</button>
      </ul>
    </form>
  </CustomModal>
</template>
