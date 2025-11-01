<style scoped lang="scss" src="./UserListCard.scss" />
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { Ref, ref, defineProps } from 'vue';
import LinkCharacterModal from './LinkCharacterModal.vue';

const store: any = useStore();
const props = defineProps<{ user: any }>();

const loading: Ref<boolean> = ref(true);
const role: Ref<string> = ref(props.user.role);
const status: Ref<string> = ref(props.user.status);
const character: Ref<string[]> = ref(props.user.character || []);

const editionActive = ref(false);
const deleteActive = ref(false);
const isModalOpen = ref(false);

function handleEdit() {
  editionActive.value = true;
}

async function handleUpdate(id: string) {
  const formData = {
    role: role.value,
    status: status.value,
    character: character.value,
  };

  await store.handleUpdateUser(formData, id);
  await store.handleGetUsers();
  await store.handleGetAdminNotifications();
  editionActive.value = false;
}

async function handleDeleteUser(id: string) {
  await store.handleDeleteUser(id);
  await store.handleGetUsers();
  await store.handleGetAdminNotifications();
}

function handleCancel() {
  // Reset fields to original values
  role.value = props.user.role;
  status.value = props.user.status;
  character.value = props.user.character || [];
  editionActive.value = false;
  deleteActive.value = false;
}

function handleDelete() {
  deleteActive.value = true;
}

async function openLinkModal() {
  await store.handleGetAdminCharacters();
  loading.value = false;
  isModalOpen.value = true;
}

function handleModalClose() {
  isModalOpen.value = false;
}

function handleModalSave(selectedIds: string[]) {
  character.value = selectedIds;
}

function styleStatus(status: string) {
  if (status === 'active') {
    return { backgroundColor: '#99d499' };
  }
  if (status === 'pending') {
    return { backgroundColor: '#eaec72' };
  }
  if (status === 'inactive') {
    return { backgroundColor: '#b67f75' };
  }
}
</script>

<template>
  <!-- Edit Mode -->
  <div class="list-container" v-if="editionActive && !deleteActive">
    <span>
      <select v-model="status">
        <option value="active">active</option>
        <option value="pending">pending</option>
        <option value="inactive">inactive</option>
      </select>
    </span>
    <span>
      <p>{{ user.battletag }}</p>
    </span>
    <span>
      <select v-model="role">
        <option value="admin">admin</option>
        <option value="user">user</option>
      </select>
    </span>
    <span>
      <p>{{ user.character?.length || 0 }}</p>
    </span>
    <span>
      <ul class="buttons-container">
        <button @click="openLinkModal"><i class="fas fa-link"></i></button>
        <button @click="handleUpdate(user._id)">✔️</button>
        <button @click="handleCancel">❌</button>
      </ul>
    </span>
  </div>

  <!-- Delete Confirmation Mode -->
  <div class="list-container red-bg" v-if="!editionActive && deleteActive">
    <span class="status-container">
      <div class="status-image">
        <img src="../../../../assets/svg/profile-icon.svg" alt="">
        <span class="status" :style="styleStatus(user.status)"></span>
      </div>
    </span>
    <span>
      <p>{{ user.battletag }}</p>
    </span>
    <span>
      <p>{{ user.role }}</p>
    </span>
    <span>
      <p>{{ user.character?.length || 0 }}</p>
    </span>
    <span>
      <ul class="buttons-container">
        <button @click="openLinkModal"><i class="fas fa-link"></i></button>
        <button @click="handleDeleteUser(user._id)">✔️</button>
        <button @click="handleCancel">❌</button>
      </ul>
    </span>
  </div>

  <!-- Display Mode -->
  <div class="list-container" v-if="!editionActive && !deleteActive">
    <span class="status-container">
      <div class="status-image">
        <img src="../../../../assets/svg/profile-icon.svg" alt="">
        <span class="status" :style="styleStatus(user.status)"></span>
      </div>
    </span>
    <span>
      <p>{{ user.battletag }}</p>
    </span>
    <span>
      <p>{{ user.role }}</p>
    </span>
    <span>
      <p>{{ user.character?.length || 0 }}</p>
    </span>
    <span>
      <ul class="buttons-container">
        <button @click="openLinkModal"><i class="fas fa-link"></i></button>

        <button @click="handleEdit">
          <img src="../../../../assets/svg/edit-icon.svg" alt="" width="18px">
        </button>
        <button @click="handleDelete">
          <img src="../../../../assets/svg/delete-icon.svg" alt="" width="22px">
        </button>
      </ul>
    </span>
  </div>

  <LinkCharacterModal :user-id="user._id" :loading="loading" v-if="isModalOpen" :initial-selected-ids="character"
    :user-name="user.battletag" @close="handleModalClose" @save="handleModalSave" />
</template>
