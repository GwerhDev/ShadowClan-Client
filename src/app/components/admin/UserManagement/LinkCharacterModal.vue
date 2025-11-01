<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue';
import CustomModal from '../../Modals/CustomModal.vue';
import { useStore } from '../../../../middlewares/store';
import { classes } from '../../../../middlewares/misc/const';

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

const getClassImage = (className: string | undefined) => {
  const foundClass = classes.find(c => c.value === className);
  return foundClass ? foundClass.image : '';
};

</script>
<template>
  <CustomModal :title="`Link character to ${userName}`">
    <div v-if="loading" class="loader">Loading...</div>
    <div v-else>
      <div v-if="store.admin.characters.length" class="member-selection-grid">
        <div v-for="character in store.admin.characters" :key="character._id" class="character-card-wrapper">
          <input type="checkbox" :id="character._id" :value="character._id" v-model="selectedMemberIds"
            @change="saveSelection" class="character-checkbox" />
          <label :for="character._id" class="character-card">
            <img v-if="character.currentClass" :src="getClassImage(character!.currentClass)"
              :title="character!.currentClass" :alt="character!.currentClass" class="class-image" />
            <div class="character-details">
              <span class="character-name">{{ character.name }}</span>
            </div>
          </label>
        </div>
      </div>
      <div class="no-member" v-else>
        <h1><i class="fas fa-ban"></i></h1>
        <h4>
          There's no characters to link
        </h4>
      </div>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./LinkCharacterModal.scss" />