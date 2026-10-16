<script setup lang="ts">
import { ref } from 'vue';
import CustomModal from '../../Modals/CustomModal.vue';
import type { AlignmentSlot } from '../../../../interfaces';

/** Modal "Guardar plantilla" compartido por Guerra Sombría y Torre Maldita. */
const props = defineProps<{
  customSlots: AlignmentSlot[];
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', name: string, overwriteIdx: number | null): void;
}>();

const name         = ref('');
const overwriteIdx = ref<number | null>(null);

function confirm() {
  emit('confirm', name.value, overwriteIdx.value);
}

const isFull = () => props.customSlots.length >= 3;
</script>

<template>
  <CustomModal title="Guardar plantilla" @close="emit('close')">
    <div class="save-alignment-modal">
      <div class="sam-field">
        <label>Nombre</label>
        <input v-model="name" maxlength="24" placeholder="Ej. Ofensiva" @keydown.enter="confirm" />
      </div>
      <div v-if="isFull()" class="sam-overwrite">
        <p>Ya tienes 3 plantillas. ¿Cuál reemplazas?</p>
        <div class="sam-slots">
          <button v-for="(slot, i) in customSlots" :key="i" class="sam-slot" :class="{ active: overwriteIdx === i }" @click="overwriteIdx = i">
            {{ slot.name }}
          </button>
        </div>
      </div>
      <div class="sam-actions">
        <button class="btn-sam-confirm" :disabled="!name.trim() || (isFull() && overwriteIdx === null) || saving" @click="confirm">
          <i class="fas fa-check"></i> Guardar
        </button>
        <button class="btn-sam-cancel" @click="emit('close')">
          <i class="fas fa-times"></i> Cancelar
        </button>
      </div>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss" src="./SaveTemplateModal.scss" />
