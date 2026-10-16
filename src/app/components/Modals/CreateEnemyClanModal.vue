<script setup lang="ts">
import { ref } from 'vue';
import { createEnemyClan } from '../../../middlewares/services';
import { activeCharacterId } from '../../../middlewares/services/activeCharacter';
import type { EnemyClanRef } from '../../../interfaces';

/**
 * Modal reutilizable para crear un clan enemigo.
 *
 * - Con `name`: modo confirmación ("¿Crear el clan X?"), el nombre viene del buscador.
 * - Sin `name`: muestra un campo de texto para escribir el nombre.
 * - Con `denied`: solo muestra el aviso de permisos (sin acciones).
 */
const props = withDefaults(defineProps<{
  name?: string;
  confirmLabel?: string;
  denied?: boolean;
  /** Deshabilita "Cancelar" mientras se crea el clan. */
  lockCancelWhileCreating?: boolean;
}>(), {
  name: undefined,
  confirmLabel: 'Crear',
  denied: false,
  lockCancelWhileCreating: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  /** `requestedName` es el nombre tal como lo ingresó el usuario (recortado). */
  (e: 'created', clan: EnemyClanRef, requestedName: string): void;
}>();

const isConfirmMode = props.name !== undefined;
const inputName     = ref('');
const creating      = ref(false);
const error         = ref('');

function currentName(): string {
  return (isConfirmMode ? props.name ?? '' : inputName.value).trim();
}

function close() {
  error.value = '';
  emit('close');
}

async function handleCreate() {
  const name = currentName();
  if (!name) return;
  creating.value = true;
  error.value    = '';
  try {
    const created = await createEnemyClan(name, activeCharacterId());
    emit('created', { _id: created._id, name: created.name }, name);
  } catch (err: any) {
    error.value = err?.response?.data?.message ?? 'Error al crear el clan.';
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="create-clan-overlay" @click.self="close">
      <div class="create-clan-modal">
        <h4 class="create-clan-title">Crear clan enemigo</h4>

        <div v-if="denied" class="create-clan-denied">
          <i class="fas fa-lock"></i>
          <p>Solo líderes u oficiales pueden crear clanes.</p>
        </div>

        <template v-else>
          <p v-if="isConfirmMode" class="create-clan-confirm-text">
            ¿Crear el clan <strong>{{ name }}</strong>?
          </p>
          <input
            v-else
            class="create-clan-input"
            type="text"
            v-model="inputName"
            placeholder="Nombre del clan"
            @keydown.enter="handleCreate"
            @keydown.esc="emit('close')"
          />
          <p v-if="error" class="create-clan-error">{{ error }}</p>
          <div class="create-clan-actions">
            <button
              class="btn-create-clan"
              :disabled="creating || (!isConfirmMode && !inputName.trim())"
              @click="handleCreate"
            >
              <i class="fas fa-check"></i> {{ confirmLabel }}
            </button>
            <button
              class="btn-cancel-modal"
              :disabled="lockCancelWhileCreating && creating"
              @click="close"
            >
              <i class="fas fa-times"></i> Cancelar
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss" src="./CreateEnemyClanModal.scss" />
