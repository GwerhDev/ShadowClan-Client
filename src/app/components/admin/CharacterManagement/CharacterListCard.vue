<style scoped lang="scss" src="./CharacterListCard.scss" />
<script setup lang="ts">
import { classes } from '../../../../middlewares/misc/const';
import { useStore } from '../../../../middlewares/store';
import { Ref, onMounted, ref } from 'vue';

const store: any = useStore();
const editionActive: Ref<boolean> = ref(false);
const deleteActive: Ref<boolean> = ref(false);

const name: Ref<string> = ref('');
const status: Ref<string> = ref('');
const resonance: Ref<number> = ref(0);
const currentClass: Ref<string> = ref('');

const props = defineProps(['character']);

onMounted(() => {
  name.value = props.character.name;
  resonance.value = props.character.resonance;
  currentClass.value = props.character.currentClass;
  status.value = props.character.claimed ? "claimed" : "unclaimed";
});

function handleEdit() {
  editionActive.value = true;
};

async function handleUpdate(id: string) {
  const formData = {
    character: name.value,
    resonance: resonance.value,
    class: currentClass.value,
  };

  await store.handleUpdateMember(id, formData);
  await store.handleGetMembers();
  editionActive.value = false;
};

async function handleDeleteMember(id: string) {
  await store.handleDeleteMember(id);
  await store.handleGetMembers();
};

function handleCancel() {
  editionActive.value = false;
  deleteActive.value = false;
};

function handleDelete() {
  deleteActive.value = true;
};

</script>

<template>
  <div class="list-container" v-if="editionActive && !deleteActive">
    <span>
      <i v-if="status === 'claimed'" class="fas fa-link" :alt="status" :title="status"></i>
      <i v-if="status === 'unclaimed'" class="fas fa-unlink" :alt="status" :title="status"></i>
    </span>
    <span>
      <input type="text" v-model="name">
    </span>
    <span>
      <input type="number" v-model.number="resonance">
    </span>
    <span>
      <select v-model="currentClass">
        <option v-for="cls in classes" :key="cls.value" :value="cls.value">
          {{ cls.name }}
        </option>
      </select>
    </span>
    <span>
      <ul class="buttons-container">
        <button @click="handleUpdate(character._id)">
          ✔️
        </button>
        <button @click="handleCancel">
          ❌
        </button>
      </ul>
    </span>
  </div>
  <div class="list-container red-bg" v-if="!editionActive && deleteActive">
    <span>
      <i v-if="status === 'claimed'" class="fas fa-link" :alt="status" :title="status"></i>
      <i v-if="status === 'unclaimed'" class="fas fa-unlink" :alt="status" :title="status"></i>
    </span>
    <span>
      <p>{{ character.name }}</p>
    </span>
    <span>
      <p>{{ character.resonance }}</p>
    </span>
    <span>
      <ul class="class-container">
        <img :src="classes.find(cls => cls.value === character.currentClass)?.image" alt="" width="30">
      </ul>
    </span>
    <span>
      <ul class="buttons-container">
        <button @click="handleDeleteMember(character._id)">
          ✔️
        </button>
        <button @click="handleCancel">
          ❌
        </button>
      </ul>
    </span>
  </div>
  <div class="list-container" v-if="!editionActive && !deleteActive">
    <span>
      <i v-if="status === 'claimed'" class="fas fa-link" :alt="status" :title="status"></i>
      <i v-if="status === 'unclaimed'" class="fas fa-unlink" :alt="status" :title="status"></i>
    </span>
    <span>
      <p>{{ character.name }}</p>
    </span>
    <span>
      <p>{{ character.resonance }}</p>
    </span>
    <span>
      <ul class="class-container">
        <img :src="classes.find(cls => cls.value === character.currentClass)?.image" :alt="character.currentClass"
          :title="character.currentClass" width="30">
      </ul>
    </span>
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
</template>