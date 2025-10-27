<style scoped lang="scss" src="./EnemyClanListCard.scss" />
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { Ref, onMounted, ref } from 'vue';

const store: any = useStore();
const editionActive: Ref<boolean> = ref(false);
const deleteActive: Ref<boolean> = ref(false);

const name: Ref<string> = ref('');
const status: Ref<string> = ref('');
const members: Ref<string> = ref('');

const props = defineProps(['clan']);

onMounted(() => {
  name.value = props.clan.name;
  status.value = props.clan.status;
  members.value = props.clan.members;
});

function handleEdit() {
  editionActive.value = true;
};

async function handleUpdate(clan: any) {
  const formData = {
    name: name.value,
    status: status.value,
    members: members.value
  };

  await store.handleUpdateClan(clan._id, formData);
  editionActive.value = false;
};

async function handleDeleteClan(id: string) {
  await store.handleDeleteClan(id);
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
      <input type="text" v-model="name">
    </span>
    <span>
      <input type="text" v-model="status">
    </span>
    <span>
      <input type="text" v-model="members">
    </span>
    <span>
      <ul class="buttons-container">
        <button @click="handleUpdate(clan)">
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
      <p>{{ clan.name }}</p>
    </span>
    <span>
      <p>{{ clan.status }}</p>
    </span>
    <span>
      <p>{{ clan.members }}</p>
    </span>
    <span>
      <ul class="buttons-container">
        <button @click="handleDeleteClan(clan._id)">
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
      <p>{{ clan.name }}</p>
    </span>
    <span>
      <p>{{ clan.status }}</p>
    </span>
    <span>
      <p>{{ clan.members }}</p>
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
