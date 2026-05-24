<script setup lang="ts">
import { ref } from 'vue';
import { useStore } from '../../../middlewares/store';
import CustomModal from './CustomModal.vue';

const emit = defineEmits(['close']);
const store: any = useStore();
const loading = ref(false);
const error   = ref('');

async function confirm() {
  loading.value = true;
  error.value   = '';
  try {
    await store.handleDeleteAccount();
  } catch {
    error.value   = 'Ocurrió un error al eliminar la cuenta. Intenta de nuevo.';
    loading.value = false;
  }
}
</script>

<template>
  <CustomModal title="Eliminar cuenta" @close="emit('close')">
    <div class="modal-body">
      <div class="warning-box">
        <i class="fas fa-triangle-exclamation"></i>
        <p>Esta acción es <strong>irreversible</strong>. Se eliminarán todos tus datos permanentemente.</p>
      </div>
      <p v-if="error" class="error-msg">{{ error }}</p>
      <div class="modal-actions">
        <button class="btn-danger" :disabled="loading" @click="confirm">
          {{ loading ? 'Eliminando...' : 'Sí, eliminar mi cuenta' }}
        </button>
        <button class="btn-cancel" @click="emit('close')">Cancelar</button>
      </div>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss">
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: .5rem 0;
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: .85rem;
  padding: .85rem 1rem;
  background: rgba(229, 115, 115, .07);
  border: 1px solid rgba(229, 115, 115, .25);
  border-radius: 8px;

  i {
    color: #e57373;
    font-size: 1.1rem;
    flex-shrink: 0;
    margin-top: 1px;
  }

  p {
    margin: 0;
    font-size: .85rem;
    color: rgba(255, 255, 255, .7);
    line-height: 1.55;
  }
}

.error-msg {
  margin: 0;
  font-size: .82rem;
  color: #e57373;
  text-align: center;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

.btn-danger,
.btn-cancel {
  width: 100%;
  padding: .6rem 1rem;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-size: .8rem;
  letter-spacing: .05em;
  cursor: pointer;
  transition: background .2s, border-color .2s;

  &:disabled { opacity: .45; cursor: not-allowed; }
}

.btn-danger {
  background: transparent;
  border: 1px solid rgba(229, 115, 115, .4);
  color: #e57373;

  &:hover:not(:disabled) {
    background: rgba(229, 115, 115, .1);
    border-color: #e57373;
  }
}

.btn-cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, .1);
  color: rgba(255, 255, 255, .4);

  &:hover { color: rgba(255, 255, 255, .7); border-color: rgba(255, 255, 255, .25); }
}
</style>
