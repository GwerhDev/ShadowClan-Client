<style scoped lang="scss" src="./AddCharacterModal.scss" />
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from '../../../../middlewares/store';
import CustomModal from '../../Modals/CustomModal.vue';
import LabeledInput from '../../Inputs/LabeledInput.vue';

const emit = defineEmits(['close']);
const store: any = useStore();
const name = ref('');
const isCharacterEmpty = computed(() => name.value.trim() === '');

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