<script setup lang="ts">
import { ref } from 'vue';

/**
 * Encabezado de solo lectura de una instancia de Torre Maldita: datos, acciones
 * (compartir, publicar, expandir) y menú contextual (editar/eliminar). Las instancias
 * se completan solas cuando pasa su fecha.
 * Se renderiza dentro de `.instance-header` (dos nodos raíz: datos + acciones).
 */
defineProps<{
  instance: any;
  expanded: boolean;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'share'): void;
  (e: 'publish'): void;
  (e: 'toggle-expand'): void;
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

const showContextMenu = ref(false);
const ctxMenuPos      = ref({ top: 0, left: 0 });

function toggleContextMenu(e: MouseEvent) {
  if (showContextMenu.value) {
    showContextMenu.value = false;
    return;
  }
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  ctxMenuPos.value = { top: rect.bottom + 4, left: rect.right };
  showContextMenu.value = true;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function instanceAvgScore(roster: { group1?: any[]; group2?: any[]; group3?: any[] } | undefined): string {
  if (!roster) return '—';
  const all = [...(roster.group1 ?? []), ...(roster.group2 ?? []), ...(roster.group3 ?? [])]
    .filter(c => c?.score != null);
  if (!all.length) return '—';
  const avg = all.reduce((s: number, c: any) => s + (c.score ?? 0), 0) / all.length;
  return avg.toLocaleString('es', { maximumFractionDigits: 0 });
}
</script>

<template>
  <div class="instance-meta">
    <i class="fas fa-chess-rook"></i>
    <span class="instance-tower-name">Torre {{ instance.towerNumber }}</span>
    <span class="instance-date">{{ formatDate(instance.date) }}</span>
    <span v-if="instance.enemyClan" class="instance-enemy">vs {{ instance.enemyClan.name }}</span>
    <span class="instance-avg-score">⌀ {{ instanceAvgScore(instance.roster) }}</span>
  </div>
  <div class="instance-actions" @click.stop>
    <button class="btn-share-trigger" @click="emit('share')">
      <i class="fas fa-share-nodes"></i> Compartir
    </button>
    <button class="btn-publish-trigger" @click="emit('publish')">
      <i class="fas fa-paper-plane"></i> Publicar
    </button>
    <button class="btn-expand" @click="emit('toggle-expand')">
      <i :class="expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
    </button>
    <!-- Menú contextual (Teleport a body para escapar de overflow:hidden) -->
    <div class="context-menu-wrapper">
      <button class="btn-dots" @click.stop="toggleContextMenu($event)">
        <i class="fas fa-ellipsis-v"></i>
      </button>
      <Teleport to="body">
        <template v-if="showContextMenu">
          <div class="context-overlay" @click="showContextMenu = false" />
          <div class="context-menu context-menu--fixed"
               :style="{ top: ctxMenuPos.top + 'px', left: ctxMenuPos.left + 'px', transform: 'translateX(-100%)' }">
            <button class="ctx-item" @click="emit('edit'); showContextMenu = false">
              <i class="fas fa-pen"></i> Editar
            </button>
            <button class="ctx-item ctx-item--danger" :disabled="saving" @click="emit('delete'); showContextMenu = false">
              <i class="fas fa-trash"></i> Eliminar
            </button>
          </div>
        </template>
      </Teleport>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./ATInstanceSummary.scss" />
