<style scoped lang="scss" src="./TasksComponent.scss" />
<script setup lang="ts">
import { onMounted, ref, Ref, watch } from "vue";
import { useStore } from '../../../middlewares/store';
import { useRoute } from 'vue-router';
import { optionTodoList } from "../../../helpers/lists";
import TasksCard from "./TasksCard.vue";
import DeniedAccess from "../../utils/DeniedAccess.vue";
import LoaderComponent from "../../utils/LoaderComponent.vue";
import CharacterSelector from "../Selectors/CharacterSelector/CharacterSelector.vue";

const store: any = useStore();
const route = useRoute();

const title: Ref = ref("");
const message: Ref = ref("");
const isButtonDisabled: Ref = ref(true);
const date: Ref = ref(new Date().toISOString().substring(0, 10));
const type: Ref = ref(route.meta.taskType as string);

async function fetchTasks() {
  try {
    message.value = "";
    store.setTaskType(type.value);
    store.setTaskDate(date.value);
    await store.handleGetTask(date.value, type.value);
  } catch (error) {
    console.error(error);
  } finally {
    if (!store.currentUser.task?.length) {
      message.value = "No hay tareas para esta fecha.";
    }
  }
}

onMounted(fetchTasks);

watch(() => route.meta.taskType, (newType) => {
  type.value = newType as string;
  fetchTasks();
});

watch(() => store.currentCharacter, fetchTasks);

async function handleDate(e: any) {
  date.value = e.target.value;
  fetchTasks();
}

function handleInput() {
  if (title.value.length) isButtonDisabled.value = false;
  else isButtonDisabled.value = true;
}

async function createTask() {
  isButtonDisabled.value = true;

  const formData: any = {
    date: date.value,
    type: type.value,
    title: title.value,
    fixed: false,
    user: !store.currentCharacter ? store.currentUser.userData.id : null,
    character: store.currentCharacter,
  };

  await store.handleCreateTask(formData);
  await fetchTasks();

  isButtonDisabled.value = true;
  title.value = "";
}
</script>

<template>
  <div class="container-tasks-component">
    <div class="tasks-container">

      <CharacterSelector />

      <div class="section-container">
        <section class="todolist-section" v-if="store.currentUser.logged">
          <div class="filter-container">
            <input :value="date" type="date" @input="handleDate" v-if="store.currentUser.logged" />
          </div>

          <form @submit.prevent="createTask" disabled
            v-if="type === 'mytasks' && !store.currentUser.taskloading">
            <input type="text" list="options" placeholder="Agregar una tarea a tu lista" v-model="title"
              @input="handleInput" />

            <datalist id="options">
              <option v-for="option of optionTodoList" :value="option"></option>
            </datalist>
            <button class="add-button" type="submit" :disabled="isButtonDisabled">
              <p>+</p>
            </button>
          </form>
          <ul v-if="store.currentUser.task?.length && !store.currentUser.taskloading">
            <TasksCard v-for="(item, index) in store.currentUser.task" :key="index" :todo="item" />
          </ul>
          <ul v-if="!store.currentUser.task?.length">{{ message }}</ul>
          <LoaderComponent
            v-if="(!store.currentUser.task?.length && !message.length) || store.currentUser.taskloading" />
        </section>
        <section v-else class="justify-content-center align-items-center d-flex g-1 w-100">
          <DeniedAccess />
        </section>
      </div>
    </div>
  </div>
</template>
