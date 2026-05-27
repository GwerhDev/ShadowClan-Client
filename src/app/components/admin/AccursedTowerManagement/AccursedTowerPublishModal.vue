<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '../../../../middlewares/store';
import { createClanPost } from '../../../../middlewares/services';
import CustomModal from '../../Modals/CustomModal.vue';

const props = defineProps<{ tower: any }>();
const emit = defineEmits(['close']);

const store            = useStore() as any;
const content          = ref('');
const posting          = ref(false);
const error            = ref('');
const currentCharacter = computed(() => store.currentCharacter);

async function publish() {
  posting.value = true;
  error.value   = '';
  try {
    await createClanPost(
      currentCharacter.value,
      content.value.trim(),
      'accursed_tower',
      props.tower._id,
    );
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
        <button class="btn-publish" @click="publish" :disabled="posting">
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
  font-family: inherit;
  font-size: .85rem;
  padding: .75rem;
  resize: none;
  transition: border-color .15s;

  &:focus { outline: none; border-color: rgba(227, 210, 168, .4); }
  &::placeholder { color: rgba(255, 255, 255, .25); }
}

.char-count {
  font-size: .72rem;
  color: rgba(255, 255, 255, .3);
  text-align: right;
  margin-top: -.5rem;
}

.publish-error {
  margin: 0;
  font-size: .82rem;
  color: #e57373;
  background: rgba(229, 115, 115, .08);
  padding: .5rem .75rem;
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
    padding: .45rem 1.1rem;
    border-radius: 6px;
    font-size: .8rem;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background .15s, border-color .15s, opacity .15s;

    &:disabled { opacity: .4; cursor: not-allowed; }
  }
}

.btn-publish {
  background: transparent;
  border-color: rgba(227, 210, 168, .35);
  color: rgb(227, 210, 168);

  &:hover:not(:disabled) {
    background: rgba(227, 210, 168, .08);
    border-color: rgba(227, 210, 168, .65);
  }
}
</style>
