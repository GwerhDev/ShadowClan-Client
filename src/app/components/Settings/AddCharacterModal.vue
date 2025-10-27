<style scoped lang="scss" src="./AddCharacterModal.scss" />
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStore } from '../../../middlewares/store';
import diabloIcon from "../../../assets/svg/diablo-icon.svg";
import { $d } from '../../../functions';

const store: any = useStore();
const warbands = ref([]);
const name: any = ref("");
const warband: any = ref(null);
const isDisabled = ref(true);

onMounted(async () => {
  warbands.value = await store.handleGetWarbands();
});

function handleName(e: Event) {
  const target = e.target as HTMLInputElement;
  name.value = target.value;
  if(name.value) {
    isDisabled.value = false;
  } else {
    isDisabled.value = true;
  }
};

function handleWarband(e: Event) {
  const target = e.target as HTMLInputElement;
  if(!target.value) return warband.value = null;
  warband.value = target.value;
};

async function handleSubmit(e: any) {
  e.preventDefault();

  const formData = {
    name: name.value,
    warband: warband.value
  }

  isDisabled.value = true;

  try {
    await store.handleCreateCharacter(formData);
    await store.handleGetCharacter();
    await store.setCurrentCharacter(store.currentUser?.userData?.character[0]?._id || null);
    handleCloseModal();
    
  } catch (error) {
    console.error(error);
  } finally {
    isDisabled.value = false;
  }
};

async function handleCloseModal() {
  await store.setCurrentCharacter(store.currentUser?.userData?.character[0]?._id || null);
  $d(".container-modal-component").style.display = "none";
};

</script>

<template>
  <div class="container-modal-component">
    <div class="modal-container">
      <span class="mb-3 mt-1">
        <ul class="d-flex col g-1">
          <span class="d-flex row align-items-center">
            <img :src="diabloIcon" alt="icon" />
            <h2>Nuevo personaje</h2>
          </span>
          <form @submit="handleSubmit">
            <ul class="d-flex col g-1">
              <span class="d-flex g-1">
                <label for="character-name-input">Nombre:</label>
                <input name="character-name-input" :oninput="handleName" type="text">
              </span>
              <span class="d-flex g-1">
                <label for="warband-name-input">Warband:</label>
                <select :onchange="handleWarband" name="warband-name-input" class="w-100">
                  <option value="">Otra</option>
                  <option v-for="warband in warbands as any" :key="warband?._id" :value="warband?._id">
                    {{ warband?.name }}
                  </option>
                </select>
              </span>
              <button :disabled="isDisabled" type="submit" class="submit-button button justify-content-center align-items-center d-flex g-1 w-100">
                Agregar a mi lista de personajes
              </button>
              <button type="button" @click="handleCloseModal" class="secondary-button">Cerrar</button>
            </ul>
          </form>
        </ul>
      </span>
    </div>
  </div>
</template>
