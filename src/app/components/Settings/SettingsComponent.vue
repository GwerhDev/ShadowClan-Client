<style scoped lang="scss" src="./SettingsComponent.scss" />
<script setup lang="ts">
import { useStore } from '../../../middlewares/store';
import diabloIcon from "../../../assets/svg/diablo-icon.svg";
import { $d } from '../../../functions';
import { onMounted } from 'vue';

const store: any = useStore();
const editionActive: boolean = false;

onMounted(async () => {
  await store.handleGetCharacter();
});

function handleOpenModal() {
  $d(".container-modal-component").style.display = "flex";
}

</script>

<template>
  <div class="container-settings-component">
    <div class="settings-container">
      <span class="mb-3 mt-1">
        <ul class="d-flex col g-1">
          <span class="d-flex row align-items-center">
            <img :src="diabloIcon" alt="icon" />
            <h1>Ajustes</h1>
          </span>

          <h3 class="mb-1">Datos personales</h3>
          <span>
            <label for="battletag-input">BattleTag</label>
            <input name="battletag-input" disabled :value="store.currentUser?.userData?.battletag" type="text">
          </span>
          <span>
            <label for="phone-input">Teléfono</label>
            <input name="phone-input" :disabled="!editionActive" :value="store.currentUser?.userData?.number"
              type="text">
          </span>

          <h3 class="mt-3">Tus personajes</h3>
          <span>
            <ul class="d-flex col g-1 w-100">
              <li class="character-container w-100" v-for="(character, index) in store.currentUser?.userData?.character as any" :key="index">
                {{ character?.name }}
              </li>
              <button @click="handleOpenModal"
                class="button justify-content-center align-items-center d-flex g-1 w-100">
                Agregar
              </button>
            </ul>
          </span>
        </ul>
      </span>
    </div>
  </div>
</template>