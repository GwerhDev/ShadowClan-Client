<style scoped lang="scss" src="./UserListCard.scss" />
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { Ref, ref, defineProps } from 'vue';
import LinkMemberModal from './LinkMemberModal.vue';

const store: any = useStore();
const props = defineProps<{ user: any }>();

const role: Ref<string> = ref(props.user.role);
const status: Ref<string> = ref(props.user.status);
const member: Ref<string[]> = ref(props.user.member || []);

const editionActive = ref(false);
const deleteActive = ref(false);
const isModalOpen = ref(false);

function handleEdit() {
  editionActive.value = true;
}

async function handleUpdate(user: any) {
  const formData = {
    status: status.value,
    role: role.value,
    member: member.value,
  };

  await store.handleUpdateUser(user._id, formData);
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
  status.value = props.user.status;
  role.value = props.user.role;
  member.value = props.user.linked_members || [];
  editionActive.value = false;
  deleteActive.value = false;
}

function handleDelete() {
  deleteActive.value = true;
}

function openLinkModal() {
  isModalOpen.value = true;
}

function handleModalClose() {
  isModalOpen.value = false;
}

function handleModalSave(selectedIds: string[]) {
  member.value = selectedIds;
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
        <option value="leader">líder</option>
        <option value="officer">oficial</option>
        <option value="member">miembro</option>
      </select>
    </span>
    <span>
      <button @click="openLinkModal">Vincular ({{ member.length }})</button>
    </span>
    <span>
      <ul class="buttons-container">
        <button @click="handleUpdate(user)">✔️</button>
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
    <span><p>{{ user.battletag }}</p></span>
    <span><p>{{ user.role }}</p></span>
    <span><p>{{ user.linked_members?.length || 0 }}</p></span>
    <span>
      <ul class="buttons-container">
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
    <span><p>{{ user.battletag }}</p></span>
    <span><p>{{ user.role }}</p></span>
    <span><p>{{ user.member?.length || 0 }}</p></span>
    <span>
      <ul class="buttons-container">
        <button @click="handleEdit">
          <img src="../../../../assets/svg/edit-icon.svg" alt="" width="18px">
        </button>
        <button @click="handleDelete">
          <img src="../../../../assets/svg/delete-icon.svg" alt="" width="22px">
        </button>
      </ul>
    </span>
  </div>

  <LinkMemberModal
    v-if="isModalOpen"
    :initial-selected-ids="member"
    :user-name="user.battletag"
    @close="handleModalClose"
    @save="handleModalSave"
  />
</template>
