<template>
  <CustomModal :title="`Vincular Miembros a ${userName}`">
    <div class="modal-body">
      <div v-if="loading" class="loader">Cargando miembros...</div>
      <div v-else class="members-list">
        <div v-for="member in allMembers" :key="member._id" class="member-item">
          <input
            type="checkbox"
            :id="member._id"
            :value="member._id"
            v-model="selectedMemberIds"
            @change="saveSelection"
          />
          <label :for="member._id">{{ member.character }}</label>
        </div>
      </div>
    </div>
  </CustomModal>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits, watch } from 'vue';
import { getMembers } from '../../../../middlewares/services';
import type { Member } from '../../../../interfaces/shadowWar';
import CustomModal from '../../Modals/CustomModal.vue';

const props = defineProps<{
  initialSelectedIds: string[];
  userName: string;
}>();

const emits = defineEmits<{'save': [selectedIds: string[]]}>();

const allMembers = ref<Member[]>([]);
const selectedMemberIds = ref<string[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const response = await getMembers();
    allMembers.value = response;
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
