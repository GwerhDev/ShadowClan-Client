<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue';
import TabModal from '../../Modals/TabModal.vue';
import { toPng } from 'html-to-image';

const props = defineProps<{ tower: any }>();
defineEmits(['close']);

const imageUrl      = ref<string | null>(null);
const imageLoading  = ref(true);
const imageTemplate = ref<HTMLElement | null>(null);

const imageCopied  = ref(false);
const imageCopying = ref(false);
const copied       = ref(false);

const TABS = [
  { key: 'imagen',   label: 'Imagen',    icon: 'fas fa-image' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'fab fa-whatsapp' },
];

const towerDate = computed(() => {
  const d = props.tower?.date;
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
});

const enemyName = computed(() => props.tower?.enemyClan?.name ?? 'Por definir');

const rosterGroups = computed(() => {
  const r = props.tower?.roster;
  if (!r) return [];
  return [
    { label: 'Grupo 1', chars: (r.group1 ?? []).filter(Boolean).map((c: any) => c.name ?? '—') },
    { label: 'Grupo 2', chars: (r.group2 ?? []).filter(Boolean).map((c: any) => c.name ?? '—') },
    { label: 'Grupo 3', chars: (r.group3 ?? []).filter(Boolean).map((c: any) => c.name ?? '—') },
  ];
});

const formattedText = computed(() => {
  const tw = props.tower;
  if (!tw) return '';
  const lines: string[] = [
    `🏰 *TORRE MALDITA N° ${tw.towerNumber}*`,
    `📅 ${towerDate.value}  ⚔️ vs *${enemyName.value}*`,
    '',
  ];
  for (const grp of rosterGroups.value) {
    lines.push(`👥 *${grp.label}:* ${grp.chars.join(', ') || '—'}`);
  }
  return lines.join('\n').trimEnd();
});

onMounted(async () => {
  await nextTick();
  if (!imageTemplate.value) return;
  try {
    imageUrl.value = await toPng(imageTemplate.value, { cacheBust: true, pixelRatio: 2 });
  } catch (e) {
    console.error('Error generando imagen:', e);
  } finally {
    imageLoading.value = false;
  }
});

function downloadImage() {
  if (!imageUrl.value) return;
  const a = document.createElement('a');
  a.download = `torre-maldita-${props.tower?.towerNumber ?? ''}.png`;
  a.href = imageUrl.value;
  a.click();
}

async function copyImageToClipboard() {
  if (!imageUrl.value || imageCopying.value) return;
  imageCopying.value = true;
  try {
    const res  = await fetch(imageUrl.value);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    imageCopied.value = true;
    setTimeout(() => { imageCopied.value = false; }, 2000);
  } catch (e) {
    console.error('Error al copiar imagen:', e);
  } finally {
    imageCopying.value = false;
  }
}

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
  <TabModal title="Compartir nómina" :tabs="TABS" default-tab="imagen" @close="$emit('close')">

    <!-- ── Pestaña imagen ── -->
    <template #imagen>
      <div class="img-tab">
        <div class="img-scroll">
          <div v-if="imageLoading" class="img-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Generando imagen…</span>
          </div>
          <template v-else>
            <img v-if="imageUrl" :src="imageUrl" class="img-result" alt="Nómina" draggable="true" />
            <div v-else class="img-state img-state--error">No se pudo generar la imagen.</div>
          </template>
        </div>

        <div class="img-tab__footer">
          <button class="btn-action btn-action--copy" @click="copyImageToClipboard" :disabled="!imageUrl || imageCopying">
            <i :class="imageCopied ? 'fas fa-check' : imageCopying ? 'fas fa-spinner fa-spin' : 'fas fa-copy'"></i>
            {{ imageCopied ? 'Copiada' : 'Copiar imagen' }}
          </button>
          <button class="btn-action btn-action--download" @click="downloadImage" :disabled="!imageUrl">
            <i class="fas fa-download"></i> Descargar
          </button>
        </div>
      </div>
    </template>

    <!-- ── Pestaña Compartir ── -->
    <template #whatsapp>
      <div class="wa-tab">
        <p class="wa-hint">
          <i class="fab fa-whatsapp"></i>
          Copia y pega en WhatsApp
        </p>
        <pre class="wa-preview">{{ formattedText || 'Sin datos de torre para compartir.' }}</pre>
        <div class="wa-actions">
          <button class="btn-copy" @click="copyText" :disabled="!formattedText">
            <i :class="copied ? 'fas fa-check' : 'fas fa-copy'"></i>
            {{ copied ? 'Copiado' : 'Copiar' }}
          </button>
        </div>
      </div>
    </template>

  </TabModal>

  <!-- Off-screen template used only for image capture -->
  <div class="img-tpl-wrap" aria-hidden="true">
    <div ref="imageTemplate" class="img-tpl">

      <div class="img-tpl__header">
        <span class="img-tpl__icon">🏰</span>
        <div class="img-tpl__header-text">
          <div class="img-tpl__title">TORRE MALDITA N° {{ tower?.towerNumber }}</div>
          <div class="img-tpl__meta">{{ towerDate }} · vs {{ enemyName }}</div>
        </div>
      </div>

      <div class="img-tpl__groups">
        <div v-for="grp in rosterGroups" :key="grp.label" class="img-tpl__group">
          <div class="img-tpl__group-head">{{ grp.label }}</div>
          <div v-for="name in grp.chars" :key="name" class="img-tpl__char">{{ name }}</div>
          <div v-if="!grp.chars.length" class="img-tpl__empty">—</div>
        </div>
      </div>

      <div class="img-tpl__footer-brand">ShadowClan</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ── Imagen tab ── */
.img-tab {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.img-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: .75rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.img-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .6rem;
  padding: 3rem 0;
  font-size: .85rem;
  color: rgba(255, 255, 255, .35);
  width: 100%;

  i { font-size: 1.1rem; }

  &--error { color: rgba(229, 115, 115, .6); }
}

.img-result {
  display: block;
  max-width: 100%;
  border-radius: 6px;
  cursor: context-menu;
}

.img-tab__footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: .65rem;
  padding-top: .85rem;
  border-top: 1px solid rgba(255, 255, 255, .07);
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .45rem 1.1rem;
  border-radius: 6px;
  font-size: .8rem;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  transition: background .15s, border-color .15s, opacity .15s;

  &:disabled { opacity: .4; cursor: not-allowed; }

  &--copy {
    border-color: rgba(37, 211, 102, .35);
    color: rgb(37, 211, 102);
    &:hover:not(:disabled) {
      background: rgba(37, 211, 102, .08);
      border-color: rgba(37, 211, 102, .6);
    }
  }

  &--download {
    border-color: rgba(227, 210, 168, .35);
    color: rgb(227, 210, 168);
    &:hover:not(:disabled) {
      background: rgba(227, 210, 168, .08);
      border-color: rgba(227, 210, 168, .6);
    }
  }
}

/* ── WhatsApp tab ── */
.wa-tab {
  display: flex;
  flex-direction: column;
  gap: .85rem;
}

.wa-hint {
  margin: 0;
  display: flex;
  align-items: center;
  gap: .4rem;
  font-size: .78rem;
  color: rgba(255, 255, 255, .35);

  i { color: rgb(37, 211, 102); font-size: .9rem; }
}

.wa-preview {
  margin: 0;
  padding: .9rem 1rem;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 8px;
  font-family: inherit;
  font-size: .82rem;
  color: #fff;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 340px;
  overflow-y: auto;
}

.wa-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .45rem 1.1rem;
  border-radius: 6px;
  font-size: .8rem;
  cursor: pointer;
  border: 1px solid rgba(37, 211, 102, .35);
  background: transparent;
  color: rgb(37, 211, 102);
  transition: background .15s, border-color .15s, opacity .15s;

  &:disabled { opacity: .4; cursor: not-allowed; }
  &:hover:not(:disabled) {
    background: rgba(37, 211, 102, .08);
    border-color: rgba(37, 211, 102, .6);
  }
}

/* ── Off-screen capture template ── */
.img-tpl-wrap {
  position: fixed;
  left: -9999px;
  top: 0;
  pointer-events: none;
  z-index: -1;
}

.img-tpl {
  width: 380px;
  background: #0f0e16;
  padding: 16px 16px 12px;
  font-family: 'Cinzel', serif;
  color: #fff;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(227, 210, 168, .25);
    margin-bottom: 12px;
  }

  &__icon { font-size: 1.5rem; line-height: 1; }

  &__title {
    font-size: .95rem;
    font-weight: 700;
    letter-spacing: .06em;
    color: rgb(227, 210, 168);
    text-transform: uppercase;
  }

  &__meta {
    font-size: .68rem;
    color: rgba(255, 255, 255, .55);
    margin-top: 2px;
    text-transform: capitalize;
  }

  &__groups {
    display: flex;
    gap: 8px;
  }

  &__group {
    flex: 1;
    background: rgba(255, 255, 255, .04);
    border: 1px solid rgba(255, 255, 255, .08);
    border-radius: 4px;
    padding: 8px 9px;
  }

  &__group-head {
    font-size: .58rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: rgba(227, 210, 168, .65);
    margin-bottom: 5px;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(227, 210, 168, .12);
  }

  &__char {
    font-size: .78rem;
    color: rgba(255, 255, 255, .92);
    line-height: 1.55;
  }

  &__empty {
    font-size: .72rem;
    color: rgba(255, 255, 255, .25);
  }

  &__footer-brand {
    text-align: right;
    font-size: .52rem;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: rgba(227, 210, 168, .25);
    padding-top: 8px;
    margin-top: 10px;
    border-top: 1px solid rgba(227, 210, 168, .08);
  }
}
</style>
