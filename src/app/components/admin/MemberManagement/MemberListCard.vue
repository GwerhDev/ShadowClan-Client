<style scoped lang="scss" src="./MemberListCard.scss" />
<script setup lang="ts">
import { classes } from '../../../../middlewares/misc/const';
import { useStore } from '../../../../middlewares/store';
import { Ref, computed, onMounted, ref } from 'vue';

const store: any = useStore();
const editionActive: Ref<boolean> = ref(false);
const deleteActive: Ref<boolean> = ref(false);

const character: Ref<string> = ref('');
const resonance: Ref<number> = ref(0);
const memberClass: Ref<string> = ref('');
const whatsapp: Ref<string> = ref('');

const formattedWhatsapp = computed(() => {
  return props.member.whatsapp.replace(/[+\s]/g, '');
});

const props = defineProps(['member']);

onMounted(() => {
  character.value = props.member.character;
  resonance.value = props.member.resonance;
  memberClass.value = props.member.class;
  whatsapp.value = props.member.whatsapp;
});

function handleEdit() {
  editionActive.value = true;
};

async function handleUpdate(member: any) {
  const formData = {
    character: character.value,
    resonance: resonance.value,
    class: memberClass.value,
    whatsapp: whatsapp.value,
  };

  await store.handleUpdateMember(member._id, formData);
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
      <img src="../../../../assets/svg/profile-icon.svg" alt="">
    </span>
    <span>
      <input type="text" v-model="character">
    </span>
    <span>
      <input type="number" v-model.number="resonance">
    </span>
    <span>
      <select v-model="memberClass">
        <option v-for="cls in classes" :key="cls.value" :value="cls.value">
          {{ cls.name }}
        </option>
      </select>
    </span>
    <span>
      <input type="text" v-model="whatsapp">
    </span>
    <span>
      <ul class="buttons-container">
        <button @click="handleUpdate(member)">
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
      <img src="../../../../assets/svg/profile-icon.svg" alt="">
    </span>
    <span>
      <p>{{ member.character }}</p>
    </span>
    <span>
      <p>{{ member.resonance }}</p>
    </span>
    <span>
      <ul class="class-container">
        <img :src="classes.find(cls => cls.value === member.class)?.image" alt="" width="30">
      </ul>
    </span>
    <span>
      <a :href="'https://wa.me/' + formattedWhatsapp" target="_blank">
        <i class="fab fa-whatsapp whatsapp-icon"></i>
      </a>
    </span>
    <span>
      <ul class="buttons-container">
        <button @click="handleDeleteMember(member._id)">
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
      <img src="../../../../assets/svg/profile-icon.svg" alt="">
    </span>
    <span>
      <p>{{ member.character }}</p>
    </span>
    <span>
      <p>{{ member.resonance }}</p>
    </span>
    <span>
      <ul class="class-container">
        <img :src="classes.find(cls => cls.value === member.class)?.image" alt="" width="30">
      </ul>
    </span>
    <span>
      <a :href="'https://wa.me/' + formattedWhatsapp" target="_blank">
        <i class="fab fa-whatsapp whatsapp-icon"></i>
      </a>
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