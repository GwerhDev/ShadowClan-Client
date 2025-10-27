<style scoped lang="scss" src="./CharacterSelector.scss" />
<script setup lang="ts">
import { useStore } from '../../../../middlewares/store';
import { $d } from '../../../../functions';

const store = useStore();

function handleChange(e: Event) {
  const target = e.target as HTMLOptionElement;
  if (target.value === "create-character") {
    $d(".container-modal-component").style.display = "flex";

  } else if (target.value === 'Por defecto') {
    return store.setCurrentCharacter(null);
  }
  store.setCurrentCharacter(target.value);
}

</script>

<template>
  <span class="mb-1">
    <select :value="store.currentCharacter || 'Por defecto'" :onchange="handleChange" class="" name="character-selector" id="character-selector">
      <option v-for="character in store.currentUser?.userData?.character" :value="character._id">{{ character.name }}</option>
      <option v-if="!store.currentUser?.userData?.character.length">Por defecto</option>
      <option value="create-character">Crear</option>
    </select>
  </span>
</template>