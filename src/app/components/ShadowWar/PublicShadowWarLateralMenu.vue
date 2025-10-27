<style scoped lang="scss" src="./PublicShadowWarLateralMenu.scss" />
<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useStore } from '../../../middlewares/store';

defineProps({ logged: Boolean });
const store: any = useStore();
const active: Ref = ref({ backgroundColor: "var(--color-primary)" });

async function handleType(type: string) {
  store.setTab(type);
};

function styleActive(type: string) {
  if (store.layout.tab == type) {
    return active.value;
  }
};

</script>

<template>
  <div class="container-lateral">
    <ul>
      <li>
        <button title="Sublime" class="first" @click="handleType('exalted')"
          :style="styleActive('exalted')">
          <i class="fas fa-crown"></i>
          <span>Sublime</span>
          <span></span>
        </button>
      </li>
      <li>
        <button title="Eminente" @click="handleType('eminent')"
          :style="styleActive('eminent')">
          <i class="fas fa-trophy"></i>
          <span>Eminente</span>
          <span></span>
        </button>
      </li>
      <li>
        <button title="Célebre" @click="handleType('famed')"
          :style="styleActive('famed')">
          <i class="fas fa-medal"></i>
          <span>Célebre</span>
          <span></span>
        </button>
      </li>
      <li>
        <button title="Imponente"  class="last" @click="handleType('proud')"
          :style="styleActive('proud')">
          <i class="fas fa-fist-raised"></i>
          <span>Imponente</span>
          <span></span>
        </button>
      </li>
    </ul>
  </div>
</template>