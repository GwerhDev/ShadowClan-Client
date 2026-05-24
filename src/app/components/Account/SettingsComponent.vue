<style scoped lang="scss" src="./SettingsComponent.scss" />
<script setup lang="ts">
import { useStore } from '../../../middlewares/store';
import { ref } from 'vue';
import LabeledInput from '../Inputs/LabeledInput.vue';
import LogoutModal from '../Modals/LogoutModal.vue';
import DeleteAccountModal from '../Modals/DeleteAccountModal.vue';

const store: any = useStore();
const showLogoutModal        = ref(false);
const showDeleteAccountModal = ref(false);
</script>

<template>
  <div class="settings-container">
    <h3 class="mb-1">Datos de la cuenta</h3>
    <LabeledInput disabled id="battletag" label="BattleTag" :modelValue="store.currentUser?.userData?.battletag" />

    <h3 class="mt-3">Aplicación</h3>
    <ul>
      <li>
        <button class="logout-button" @click="showLogoutModal = true">
          <i class="fas fa-right-from-bracket"></i> Cerrar sesión
        </button>
      </li>
      <li>
        <button class="danger-button" @click="showDeleteAccountModal = true">
          <i class="fas fa-trash"></i> Eliminar cuenta
        </button>
      </li>
    </ul>

    <LogoutModal        v-if="showLogoutModal"        @close="showLogoutModal = false" />
    <DeleteAccountModal v-if="showDeleteAccountModal" @close="showDeleteAccountModal = false" />
  </div>
</template>
