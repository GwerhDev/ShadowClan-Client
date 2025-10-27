<style scoped lang="scss" src="./AddEnemyClanModal.scss" />
<script setup lang="ts">
import { computed, ref } from 'vue';
import CustomModal from '../../Modals/CustomModal.vue';
import { useStore } from '../../../../middlewares/store';

const emit = defineEmits(['close', 'clanCreated']);

const store: any = useStore();
const clanName = ref('');
const clanStatus = ref('active'); // Default status
const clanMembers = ref(0); // Default members

const isClanNameEmpty = computed(() => clanName.value.trim() === '');

const handleCloseModal = () => {
  emit('close');
};

const handleSubmit = async () => {
  if (clanName.value.trim()) {
    const newClan = {
      name: clanName.value.trim(),
      status: clanStatus.value,
      members: clanMembers.value,
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
        <span class="d-flex g-1">
          <label for="clanName">Nombre del Clan:</label>
          <input type="text" id="clanName" v-model="clanName" required>
        </span>
        <span class="d-flex g-1">
          <label for="clanStatus">Estado:</label>
          <select id="clanStatus" v-model="clanStatus" required>
            <option value="top">Top</option>
            <option value="active">Activo</option>
            <option value="ghost">Fantasma</option>
          </select>
        </span>
        <span class="d-flex g-1">
          <label for="clanMembers">Miembros:</label>
          <input type="number" id="clanMembers" v-model.number="clanMembers" min="0" required>
        </span>
        <button type="submit" :disabled="isClanNameEmpty"
          class="submit-button button justify-content-center align-items-center d-flex g-1 w-100">Crear Clan</button>
      </ul>
    </form>
  </CustomModal>
</template>
