<style scoped lang="scss" src="./SettingsComponent.scss" />
<script setup lang="ts">
import { useStore } from '../../../middlewares/store';
import { $d } from '../../../functions';
import { onMounted, Ref, ref } from 'vue';
import LabeledInput from '../Inputs/LabeledInput.vue';
import CharacterCard from '../Cards/CharacterCard.vue';
import AddCharacterModal from './AddCharacterModal.vue';

const store: any = useStore();
const showModal: Ref = ref(false);
const editionActive: boolean = false;

onMounted(async () => {
  await store.handleGetCharacter();
});

const handleOpenModal = () => {
  showModal.value = true;
};

const handleLogout = async () => {
  $d('#account-menu-mobile').style.display = 'none'
  store.handleLogout();
};

</script>

<template>
  <div class="settings-container">
    <h3 class="mb-1">Datos de la cuenta</h3>
    <LabeledInput disabled id="battletag" label="BattleTag" :modelValue="store.currentUser?.userData?.battletag" />
    <LabeledInput :disabled="!editionActive" id="telefono" label="Teléfono"
      :modelValue="store.currentUser?.userData?.number" />

    <h3 class="mt-3">Tus personajes</h3>
    <ul>
      <li class="character-container" v-for="(character, index) in store.currentUser?.userData?.character as any"
        :key="index">
        <CharacterCard :character="character" />
      </li>
      <button @click="handleOpenModal" class="button justify-content-center align-items-center d-flex g-1 w-100">
        Agregar
      </button>
      <button class="logout-button" @click="handleLogout">
        Cerrar sesión
      </button>
    </ul>
    <add-character-modal v-if="showModal" @close="showModal = false" />
  </div>
</template>