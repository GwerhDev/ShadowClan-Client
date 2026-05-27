<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from '../../../../middlewares/store';
import CustomModal from '../../Modals/CustomModal.vue';

const store: any = useStore();
const emit = defineEmits(['close']);

const copied = ref(false);

const shadowWarData = computed(() => store.currentUser.shadowWarData);

const categoryLabels: Record<string, string> = {
  exalted: 'Sublime',
  eminent: 'Eminente',
  famed:   'Célebre',
  proud:   'Imponente',
};


const formattedText = computed(() => {
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
  <CustomModal title="Compartir formación" @close="$emit('close')">
    <div class="share-modal">

      <p class="share-hint">
        <i class="fab fa-whatsapp"></i>
        Vista previa del mensaje para WhatsApp
      </p>

      <pre class="share-preview">{{ formattedText || 'Sin datos de guerra para compartir.' }}</pre>

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
  max-height: 420px;
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
