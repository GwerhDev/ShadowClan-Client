<style scoped lang="scss" src="./AddClanModal.scss" />
<script setup lang="ts">
import { computed, ref } from 'vue';
import CustomModal from '../../Modals/CustomModal.vue';
import { useStore } from '../../../../middlewares/store';
import LabeledInput from '../../Inputs/LabeledInput.vue';

const emit = defineEmits(['close', 'clanCreated']);

const store: any = useStore();
const clanName = ref('');
const isClanNameEmpty = computed(() => clanName.value.trim() === '');

const handleCloseModal = () => {
  emit('close');
};

const handleSubmit = async () => {
  if (clanName.value.trim()) {
    const newClan = {
      name: clanName.value.trim(),
    };
    await store.handleCreateClan(newClan);
    emit('clanCreated');
    handleCloseModal();
  }
};
</script>

<template>
  <CustomModal title="Crear nuevo Clan" @close="$emit('close')">
    <form @submit.prevent="handleSubmit">
      <ul class="d-flex col g-1">
        <LabeledInput label="Nombre del Clan" id="name" v-model="clanName" required />
        <button type="submit" :disabled="isClanNameEmpty"
          class="submit-button button justify-content-center align-items-center d-flex g-1 w-100">Crear Clan</button>
      </ul>
    </form>
  </CustomModal>
</template>
