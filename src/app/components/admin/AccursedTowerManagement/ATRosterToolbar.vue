<script setup lang="ts">
import type { SavedAlignments } from '../../../../interfaces';

/** Barra de acciones de la formación de Torre Maldita (guardar, plantillas, auto-asignar). */
defineProps<{
  savedAlignments: SavedAlignments;
  savingAlignment: boolean;
  autoAssigning: boolean;
}>();

const emit = defineEmits<{
  (e: 'save-last'): void;
  (e: 'save-template'): void;
  (e: 'auto-assign'): void;
  (e: 'reset'): void;
  (e: 'apply', data: any): void;
  (e: 'delete-template', index: number): void;
}>();
</script>

<template>
  <div class="roster-toolbar">
    <div class="roster-toolbar-row">
      <button class="btn-roster-action" :disabled="savingAlignment || autoAssigning" @click="emit('save-last')">
        <i class="fas fa-clock-rotate-left"></i> Guardar última
      </button>
      <button class="btn-roster-action" :disabled="savingAlignment || autoAssigning" @click="emit('save-template')">
        <i class="fas fa-bookmark"></i> Guardar plantilla
      </button>
      <button class="btn-roster-action" :disabled="savingAlignment || autoAssigning" @click="emit('auto-assign')">
        <i class="fas fa-bolt"></i> Auto-asignar
      </button>
      <button class="btn-roster-action btn-roster-action--reset" :disabled="savingAlignment || autoAssigning" @click="emit('reset')">
        <i class="fas fa-trash-alt"></i> Resetear
      </button>
    </div>
    <div v-if="savedAlignments.last || savedAlignments.custom.length > 0" class="roster-toolbar-row roster-toolbar-row--apply">
      <span class="apply-label">Aplicar:</span>
      <button v-if="savedAlignments.last" class="btn-roster-action btn-roster-action--apply" :disabled="savingAlignment" @click="emit('apply', savedAlignments.last)">
        <i class="fas fa-clock-rotate-left"></i> Última
      </button>
      <span v-for="(slot, i) in savedAlignments.custom" :key="i" class="alignment-chip">
        <button class="btn-roster-action btn-roster-action--apply" :disabled="savingAlignment" :title="slot.name" @click="emit('apply', slot.data)">
          <i class="fas fa-bookmark"></i> {{ slot.name }}
        </button>
        <button class="btn-chip-delete" :disabled="savingAlignment" title="Eliminar plantilla" @click="emit('delete-template', i)">
          <i class="fas fa-times"></i>
        </button>
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./ATRosterToolbar.scss" />
