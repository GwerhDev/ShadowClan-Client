<style scoped lang="scss" src="./TasksCard.scss"/>
<script setup lang="ts">
import { useStore } from '../../../middlewares/store';
import { Ref, ref } from 'vue'

const store: any = useStore();
const props: any = defineProps({ todo: Object });

const editionActive: Ref = ref(false);
const isCheckInputDisabled: Ref = ref(false);
const deleteConfirmationActive: Ref = ref(false);
const isInputDisabled: Ref = ref("");
const checkedStyle: Ref = ref(props.todo.completed);
const editedTitle: Ref = ref("");
const titleStyle: Ref = ref({ color: "#7fa87f", textDecoration: "line-through" });

function handleActivateEditionButton() {
  isInputDisabled.value = false;
  editionActive.value = true;
  editedTitle.value = props.todo.title;
};

function handleEditedTidleInput(e: any) {
  editedTitle.value = e.target.value;
};

function cancelEdit() {
  editionActive.value = false;
};

function cancelDelete() {
  deleteConfirmationActive.value = false;
};

function handleDeleteButton() {
  deleteConfirmationActive.value = true;
};

async function handleCheckButton(e: any) {
  isCheckInputDisabled.value = true;

  const formData = {
    date: store.currentUser.taskdate,
    type: store.currentUser.tasktype,
    character: store.currentCharacter,
  };

  if (e.target.checked) {
    await store.handleCreateCompletedTask(props.todo._id, formData);
  } else {
    await store.handleDeleteCompletedTask(props.todo._id, formData);
  };

  await store.handleGetTask(store.currentUser.taskdate, store.currentUser.tasktype);
  checkedStyle.value = e.target.checked;
  isCheckInputDisabled.value = false;
};

async function updateEdit() {
  isInputDisabled.value = true;

  const formData: any = {
    title: editedTitle.value,
  };

  await store.handleUpdateTask(props.todo._id, formData);
  await store.handleGetTask(store.currentUser.taskdate, store.currentUser.tasktype);

  editionActive.value = false;
};

async function handleDeleteTaskConfirmation() {
  await store.handleDeleteTask(props.todo._id, store.currentUser.taskdate);
  await store.handleGetTask(store.currentUser.taskdate, store.currentUser.tasktype);

  deleteConfirmationActive.value = false;
};

</script>

<template>
  <li v-if="!editionActive && !deleteConfirmationActive">
    <div class="loader" v-if="isCheckInputDisabled"></div>
    <input type="checkbox" :checked="props.todo.completed" :disabled="isCheckInputDisabled" @change="handleCheckButton" />
    <p :style="props.todo.completed ? titleStyle : null">{{ props.todo.title }}</p>
    <span v-if="!props.todo.fixed">
      <button @click="handleActivateEditionButton">
        <img src="../../../assets/svg/edit-icon.svg" alt="">
      </button>
      <button @click="handleDeleteButton">
        <img src="../../../assets/svg/delete-icon.svg" alt="">
      </button>
    </span>
    <span v-else>
      <button disabled>
        <img src="../../../assets/svg/fixed-icon.svg" alt="">
      </button>
    </span>
  </li>
  <li v-if="editionActive && !deleteConfirmationActive">
    <input type="checkbox" disabled />
    <input class="edit-input" :value="props.todo.title" type="text" @input="handleEditedTidleInput">
    <span>
      <button @click="updateEdit">
        ✔️
      </button>
      <button @click="cancelEdit">
        ❌
      </button>
    </span>
  </li>
  <li v-if="deleteConfirmationActive">
    <input type="checkbox" disabled />
    <p>{{ props.todo.title }}</p>
    <span>
      <button @click="handleDeleteTaskConfirmation">
        ✔️
      </button>
      <button @click="cancelDelete">
        ❌
      </button>
    </span>
  </li>
</template>
