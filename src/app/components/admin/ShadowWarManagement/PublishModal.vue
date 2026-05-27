<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '../../../../middlewares/store';
import { createClanPost } from '../../../../middlewares/services';
import CustomModal from '../../Modals/CustomModal.vue';
import { classes } from '../../../../middlewares/misc/const';

const store: any = useStore();
const emit = defineEmits(['close']);

const content = ref('');
const posting = ref(false);
const error = ref('');
const copied = ref(false);

const shadowWarData = computed(() => store.currentUser.shadowWarData);
const currentCharacter = computed(() => store.currentCharacter);

const categoryLabels: Record<string, string> = {
  exalted: 'Sublime',
  eminent: 'Eminente',
  famed:   'Célebre',
  proud:   'Imponente',
};

function getClassName(value: string | undefined) {
  return classes.find(c => c.value === value)?.name ?? value ?? '';
}

function formatWhatsApp(): string {
  const data = shadowWarData.value;
  if (!data) return '';

  const date = data.date
    ? new Date(data.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : '—';
  const enemy = data.enemyClan?.name ?? 'Por definir';

  const lines: string[] = [
    `🗡️ *GUERRA SOMBRÍA*`,
    `📅 ${date}  ⚔️ vs *${enemy}*`,
    '',
  ];

  const battle = data.battle ?? {};
  for (const [cat, matches] of Object.entries(battle) as [string, any[]][]) {
    if (!matches?.length) continue;
    lines.push(`*═══ BATALLA ${categoryLabels[cat]?.toUpperCase() ?? cat.toUpperCase()} ═══*`);
    matches.forEach((match: any, i: number) => {
      const g1 = (match.group1?.character ?? [])
        .filter(Boolean)
        .map((c: any) => c.name ?? '—')
        .join(', ') || '—';
      const g2 = (match.group2?.character ?? [])
        .filter(Boolean)
        .map((c: any) => c.name ?? '—')
        .join(', ') || '—';
      lines.push(`*Partida ${i + 1}*`);
      lines.push(`👥 Grupo 1: ${g1}`);
      lines.push(`👥 Grupo 2: ${g2}`);
      if (i < matches.length - 1) lines.push('');
    });
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

async function copyWhatsApp() {
  const text = formatWhatsApp();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
}

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
        <button class="btn-whatsapp" @click="copyWhatsApp" :disabled="!shadowWarData">
          <i :class="copied ? 'fas fa-check' : 'fab fa-whatsapp'"></i>
          {{ copied ? 'Copiado' : 'Copiar formación (WhatsApp)' }}
        </button>
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

.btn-whatsapp {
  background: transparent;
  border-color: rgba(37, 211, 102, .35);
  color: rgb(37, 211, 102);

  &:hover:not(:disabled) {
    background: rgba(37, 211, 102, .08);
    border-color: rgba(37, 211, 102, .6);
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
