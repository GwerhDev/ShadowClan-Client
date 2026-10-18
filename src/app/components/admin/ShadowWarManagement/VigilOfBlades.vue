<script setup lang="ts">
import { ref } from 'vue';
import CreateShadowWarForm from './CreateShadowWarForm.vue';
import PublishModal from './PublishModal.vue';
import { provideSWKind } from '../../../composables/useSWKind';
import InfoPopover from '../../common/InfoPopover.vue';

// Vigilia de Espadas: misma formación y flujo que la Guerra Sombría. La abren líderes y
// oficiales cuando el clan clasifica (top 3 del ranking); la app no lleva el ranking.
provideSWKind('vigil_of_blades');

const showPublishModal = ref(false);
</script>

<template>
  <div class="shadow-war-container">
    <span class="info-text">
      <span class="title">
        <h2>Prepárate para la batalla</h2>
        <InfoPopover label="Qué es la Vigilia de Espadas">
          Solo para los 3 primeros clanes del ranking: se enfrentan a los Inmortales los domingos a las 20:00h (server)
          durante las 3 primeras semanas del ciclo. Ábrela cuando el clan clasifique; los miembros la verán como pestaña
          mientras esté abierta y se completa sola a las 20:30h de su fecha.
        </InfoPopover>
      </span>
    </span>
    <CreateShadowWarForm @publish="showPublishModal = true" />
    <PublishModal v-if="showPublishModal" @close="showPublishModal = false" />
  </div>
</template>

<style scoped lang="scss" src="./ShadowWar.scss" />
