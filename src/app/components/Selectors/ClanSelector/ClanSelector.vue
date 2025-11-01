<style scoped lang="scss" src="./ClanSelector.scss" />
<script setup lang="ts">
import { ref, Ref } from 'vue';
import { useStore } from '../../../../middlewares/store';
import AddCharacterModal from '../../admin/ClanManagement/AddClanModal.vue';

const store = useStore();
const showModal: Ref = ref(false);

function handleChange(e: Event) {
  const target = e.target as HTMLOptionElement;
  if (target.value === "create-character") {
    showModal.value = true;
    return;

  } else if (target.value === 'Por defecto') {
    return store.setCurrentCharacter(null);
  }
  store.setCurrentCharacter(target.value);
}

</script>

<template>
  <span class="character-selector-container">
    <select :value="store.currentCharacter || 'Por defecto'" :onchange="handleChange" class="" name="character-selector"
      id="character-selector">
      <option v-for="character in store.currentUser?.userData?.character" :value="character">{{ character.name }}
      </option>
      <option v-if="!store.currentUser?.userData?.character.length">Por defecto</option>
      <option value="create-character">Vincular personaje</option>
    </select>
    <add-character-modal v-if="showModal" @close="showModal = false" />
  </span>
</template>