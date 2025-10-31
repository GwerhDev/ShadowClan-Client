<style scoped lang="scss" src="./SettingsComponent.scss" />
<script setup lang="ts">
import { useStore } from '../../../middlewares/store';
import { onMounted, Ref, ref } from 'vue';
import LabeledInput from '../Inputs/LabeledInput.vue';
import CharacterCard from '../Cards/CharacterCard.vue';
import AddCharacterModal from './AddCharacterModal.vue';
import DangerButton from '../Buttons/DangerButton.vue';
import PrimaryButton from '../Buttons/PrimaryButton.vue';
import LogoutModal from '../Modals/LogoutModal.vue';
import DeleteAccountModal from '../Modals/DeleteAccountModal.vue';

const store: any = useStore();
const showLogoutModal: Ref = ref(false);
const showAddCharacterModal: Ref = ref(false);
const showDeleteAccountModal: Ref = ref(false);
const editionActive: boolean = false;

onMounted(async () => {
  await store.handleGetCharacter();
});

const handleOpenModal = () => {
  showAddCharacterModal.value = true;
};

const handleDeleteAccount = () => {
  showDeleteAccountModal.value = true;
};

const handleLogout = async () => {
  showLogoutModal.value = true;
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
      <li>
        <PrimaryButton text="Agregar" :onclick="handleOpenModal" />
      </li>
    </ul>

    <h3 class="mt-3">Aplicación</h3>
    <ul>
      <li>
        <DangerButton text="Eliminar cuenta" :onclick="handleDeleteAccount" />
      </li>
      <li>
        <button class="logout-button" @click="handleLogout">
          Cerrar sesión
        </button>
      </li>
    </ul>
    <LogoutModal v-if="showLogoutModal" @close="showLogoutModal = false" />
    <DeleteAccountModal v-if="showDeleteAccountModal" @close="showDeleteAccountModal = false" />
    <add-character-modal v-if="showAddCharacterModal" @close="showAddCharacterModal = false" />
  </div>
</template>