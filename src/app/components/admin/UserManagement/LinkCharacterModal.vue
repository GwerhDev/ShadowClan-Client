<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue';
import CustomModal from '../../Modals/CustomModal.vue';
import { useStore } from '../../../../middlewares/store';

const props = defineProps<{
  initialSelectedIds: string[];
  userName: string;
  userId: string;
  loading: boolean;
}>();

const store: any = useStore();

const emits = defineEmits<{ 'save': [selectedIds: string[]] }>();

const selectedMemberIds = ref<string[]>([]);

watch(() => props.initialSelectedIds, (newVal) => {
  selectedMemberIds.value = [...newVal];
}, { immediate: true });

const saveSelection = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const formData = {
    userId: props.userId,
    characterId: target.value,
  }
  if (target.checked) {

    await store.handleClaimCharacterAsAdmin(formData);

  } else {
    await store.handleUnclaimCharacterAsAdmin(formData);    
  }
  emits('save', selectedMemberIds.value);
};
</script>
<template>
  <CustomModal :title="`Link character to ${userName}`">
    <div class="modal-body">
      <div v-if="loading" class="loader">Cargando miembros...</div>
      <div v-else class="members-list">
        <div v-for="character in store.admin.characters" :key="character._id" class="character-item">
          <input type="checkbox" :id="character._id" :value="character._id" v-model="selectedMemberIds"
            @change="saveSelection" />
          <label :for="character._id">{{ character.name }}</label>
        </div>
      </div>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./LinkCharacterModal.scss" />
