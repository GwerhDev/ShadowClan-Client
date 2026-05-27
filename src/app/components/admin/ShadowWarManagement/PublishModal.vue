<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '../../../../middlewares/store';
import { createClanPost } from '../../../../middlewares/services';
import CustomModal from '../../Modals/CustomModal.vue';

const store: any = useStore();
const emit = defineEmits(['close']);

const content = ref('');
const posting = ref(false);
const error = ref('');

const shadowWarData = computed(() => store.currentUser.shadowWarData);
const currentCharacter = computed(() => store.currentCharacter);

async function publish() {
  if (!content.value.trim() && !shadowWarData.value) return;
  posting.value = true;
  error.value = '';
  try {
    await createClanPost(currentCharacter.value, content.value.trim(), 'shadow_war');
    content.value = '';
    emit('close');
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Error al publicar.';
  } finally {
    posting.value = false;
  }
}
</script>

<template>
  <CustomModal title="Publicar" @close="$emit('close')">
    <div class="publish-modal">

      <textarea
        v-model="content"
        class="publish-textarea"
        placeholder="¿Qué quieres comunicar al clan?"
        maxlength="1000"
        rows="5"
      />
      <span class="char-count">{{ content.length }} / 1000</span>

      <p v-if="error" class="publish-error">{{ error }}</p>

      <div class="publish-actions">
        <button class="btn-publish" @click="publish" :disabled="(!content.trim() && !shadowWarData) || posting">
          <i class="fas fa-paper-plane"></i>
          {{ posting ? 'Publicando...' : 'Publicar' }}
        </button>
      </div>

    </div>
  </CustomModal>
</template>

<style scoped lang="scss">
.publish-modal {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  width: 100%;
}

.publish-textarea {
  width: 100%;
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 8px;
  color: var(--color-app-white);
  font-size: .9rem;
  padding: .75rem 1rem;
  resize: none;
  overflow: auto;
  font-family: inherit;
  transition: border-color .15s;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, .25);
  }

  &::placeholder { color: rgba(255, 255, 255, .25); }
}

.char-count {
  font-size: .7rem;
  color: rgba(255, 255, 255, .3);
  text-align: right;
  margin-top: -.5rem;
}

.publish-error {
  margin: 0;
  font-size: .82rem;
  color: #e57373;
  padding: .5rem .75rem;
  background: rgba(229, 115, 115, .08);
  border: 1px solid rgba(229, 115, 115, .3);
  border-radius: 6px;
}

.publish-actions {
  display: flex;
  gap: .75rem;
  justify-content: flex-end;

  button {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    padding: .5rem 1.1rem;
    border-radius: 6px;
    font-size: .8rem;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background .2s, border-color .2s, opacity .15s;

    &:disabled { opacity: .4; cursor: not-allowed; }
  }
}

.btn-publish {
  background: transparent;
  border-color: rgba(227, 210, 168, .35);
  color: rgb(227, 210, 168);

  &:hover:not(:disabled) {
    background: rgba(227, 210, 168, .08);
    border-color: rgba(227, 210, 168, .6);
  }
}
</style>
