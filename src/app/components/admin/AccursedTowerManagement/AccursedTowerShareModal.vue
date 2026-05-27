<script setup lang="ts">
import { computed, ref } from 'vue';
import CustomModal from '../../Modals/CustomModal.vue';

const props = defineProps<{ tower: any }>();
defineEmits(['close']);

const copied = ref(false);

const formattedText = computed(() => {
  const tw = props.tower;
  if (!tw) return '';

  const date  = new Date(tw.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const enemy = tw.enemyClan?.name ?? 'Por definir';

  const lines: string[] = [
    `🏰 *TORRE MALDITA N° ${tw.towerNumber}*`,
    `📅 ${date}  ⚔️ vs *${enemy}*`,
    '',
  ];

  const groups: { key: 'group1' | 'group2' | 'group3'; label: string }[] = [
    { key: 'group1', label: 'Grupo 1' },
    { key: 'group2', label: 'Grupo 2' },
    { key: 'group3', label: 'Grupo 3' },
  ];

  for (const grp of groups) {
    const chars = (tw.roster?.[grp.key] ?? [])
      .filter(Boolean)
      .map((c: any) => c.name ?? '—')
      .join(', ') || '—';
    lines.push(`👥 *${grp.label}:* ${chars}`);
  }

  return lines.join('\n').trimEnd();
});

async function copyText() {
  if (!formattedText.value) return;
  try {
    await navigator.clipboard.writeText(formattedText.value);
  } catch {
    const el = document.createElement('textarea');
    el.value = formattedText.value;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}
</script>

<template>
  <CustomModal title="Compartir nómina" @close="$emit('close')">
    <div class="share-modal">

      <p class="share-hint">
        <i class="fab fa-whatsapp"></i>
        Vista previa del mensaje para WhatsApp
      </p>

      <pre class="share-preview">{{ formattedText || 'Sin datos de torre para compartir.' }}</pre>

      <div class="share-actions">
        <button class="btn-cancel" @click="$emit('close')">Cerrar</button>
        <button class="btn-copy" @click="copyText" :disabled="!formattedText">
          <i :class="copied ? 'fas fa-check' : 'fas fa-copy'"></i>
          {{ copied ? 'Copiado' : 'Copiar' }}
        </button>
      </div>

    </div>
  </CustomModal>
</template>

<style scoped lang="scss">
.share-modal {
  display: flex;
  flex-direction: column;
  gap: .85rem;
  width: 100%;
}

.share-hint {
  margin: 0;
  display: flex;
  align-items: center;
  gap: .4rem;
  font-size: .78rem;
  color: rgba(255, 255, 255, .35);

  i { color: rgb(37, 211, 102); font-size: .9rem; }
}

.share-preview {
  margin: 0;
  padding: .9rem 1rem;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 8px;
  font-family: inherit;
  font-size: .82rem;
  color: var(--color-app-white);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 360px;
  overflow-y: auto;
}

.share-actions {
  display: flex;
  gap: .65rem;
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

.btn-cancel {
  background: transparent;
  border-color: rgba(255, 255, 255, .12);
  color: rgba(255, 255, 255, .5);

  &:hover { background: rgba(255, 255, 255, .05); border-color: rgba(255, 255, 255, .22); }
}

.btn-copy {
  background: transparent;
  border-color: rgba(37, 211, 102, .35);
  color: rgb(37, 211, 102);

  &:hover:not(:disabled) {
    background: rgba(37, 211, 102, .08);
    border-color: rgba(37, 211, 102, .6);
  }
}
</style>
