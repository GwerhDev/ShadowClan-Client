<template>
  <CustomModal :title="`Vincular personajes a ${userName}`">
    <div class="modal-body">
      <div v-if="loading" class="loader">Cargando miembros...</div>
      <div v-else class="members-list">
        <div v-for="character in allCharacters" :key="character._id" class="character-item">
          <input
            type="checkbox"
            :id="character._id"
            :value="character._id"
            v-model="selectedMemberIds"
            @change="saveSelection"
          />
          <label :for="character._id">{{ character.name }}</label>
        </div>
      </div>
    </div>
  </CustomModal>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits, watch } from 'vue';
import { getAdminCharacters } from '../../../../middlewares/services';
import type { Character } from '../../../../interfaces';
import CustomModal from '../../Modals/CustomModal.vue';

const props = defineProps<{
  initialSelectedIds: string[];
  userName: string;
}>();

const emits = defineEmits<{'save': [selectedIds: string[]]}>();

const allCharacters = ref<Character[]>([]);
const selectedMemberIds = ref<string[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const response = await getAdminCharacters();
    allCharacters.value = response;
  } catch (error) {
    console.error("Error fetching clan members:", error);
  } finally {
    loading.value = false;
  }
});

watch(() => props.initialSelectedIds, (newVal) => {
  selectedMemberIds.value = [...newVal];
}, { immediate: true });

const saveSelection = () => {
  emits('save', selectedMemberIds.value);
};
</script>

<style lang="scss" scoped>
@import './LinkMemberModal.scss';
</style>
