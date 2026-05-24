<script setup lang="ts">
import { ref } from 'vue';
import { useStore } from '../../../middlewares/store';
import CustomModal from './CustomModal.vue';

const emit = defineEmits(['close']);
const store: any = useStore();
const loading = ref(false);

async function confirm() {
  loading.value = true;
  await store.handleLogout();
}
</script>

<template>
  <CustomModal title="Cerrar sesión" @close="emit('close')">
    <div class="modal-body">
      <p>¿Estás seguro de que deseas cerrar sesión?</p>
      <div class="modal-actions">
        <button class="btn-confirm" :disabled="loading" @click="confirm">
          {{ loading ? 'Cerrando...' : 'Cerrar sesión' }}
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

  p {
    margin: 0;
    font-size: .9rem;
    color: rgba(255, 255, 255, .7);
    text-align: center;
  }
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

.btn-confirm,
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

.btn-confirm {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, .25);
  color: rgba(255, 255, 255, .8);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, .07);
    border-color: rgba(255, 255, 255, .5);
    color: #fff;
  }
}

.btn-cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, .1);
  color: rgba(255, 255, 255, .4);

  &:hover { color: rgba(255, 255, 255, .7); border-color: rgba(255, 255, 255, .25); }
}
</style>
