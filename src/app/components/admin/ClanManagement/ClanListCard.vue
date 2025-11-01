<style scoped lang="scss" src="./ClanListCard.scss" />
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { Ref, onMounted, ref } from 'vue';

const store: any = useStore();
const editionActive: Ref<boolean> = ref(false);
const deleteActive: Ref<boolean> = ref(false);

const name: Ref<string> = ref('');
const member: Ref<string> = ref('');
const leader: Ref<string> = ref('');

const props = defineProps(['clan']);

onMounted(() => {
  name.value = props.clan.name;
  member.value = props.clan.member;
  leader.value = props.clan.leader;
});

function handleEdit() {
  editionActive.value = true;
};

async function handleUpdate(clan: any) {
  const formData = {
    name: name.value,
    member: member.value,
    leader: leader.value,
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
      <input type="text" v-model="leader">
    </span>
    <span>
      <input type="text" v-model="member">
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
      <p>{{ clan.leader }}</p>
    </span>
    <span>
      <p>{{ clan.member }}</p>
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
      <p>{{ clan.leader.name }}</p>
    </span>
    <span>
      <p>{{ clan.member.length }}</p>
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
