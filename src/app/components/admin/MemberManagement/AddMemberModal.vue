<style scoped lang="scss" src="./AddMemberModal.scss" />
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '../../../../middlewares/store';
import { classes } from '../../../../middlewares/misc/const';
import CustomModal from '../../Modals/CustomModal.vue';
import LabeledInput from '../../Inputs/LabeledInput.vue';

const emit = defineEmits(['close']);
const store: any = useStore();

const whatsapp = ref('');
const name = ref('');
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

const isCharacterEmpty = computed(() => name.value.trim() === '');

function handleClassSelection(classValue: string) {
  selectedClass.value = classValue;
};

function handleCloseModal() {
  emit('close');
};

function handleSubmit() {
  const formData = {
    name: name.value,
  };
  store.handleCreateMember(formData);
  handleCloseModal();
};
</script>

<template>
  <CustomModal title="Agregar miembro" @close="$emit('close')">
    <form @submit.prevent="handleSubmit">
      <ul class="d-flex col g-1">
        <LabeledInput label="Nombre del personaje" id="name" v-model="name" required />

        <button type="submit" :disabled="isCharacterEmpty"
          class="submit-button button justify-content-center align-items-center d-flex g-1 w-100">Agregar
          Miembro</button>
      </ul>
    </form>
  </CustomModal>
</template>