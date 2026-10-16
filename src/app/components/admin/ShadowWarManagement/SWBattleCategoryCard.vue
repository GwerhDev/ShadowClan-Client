<script setup lang="ts">
import { computed } from 'vue';
import ShadowWarMemberCard from './ShadowWarMemberCard.vue';
import { swCategoryLabel } from '../../../../middlewares/misc/shadowWar';
import { swSlotKey, SWSlotRef } from '../../../composables/useFormationEdit';
import type { Match } from '../../../../interfaces';

type Group = 'group1' | 'group2';
type RespondAction = 'confirm' | 'decline' | 'pending';

/** Tarjeta colapsable de una categoría de batalla en el formulario de Guerra Sombría. */
const props = defineProps<{
  categoryName: string;
  matches: Match[];
  expanded: boolean;
  dragSourceKey: string | null;
  dragOverKey: string | null;
  confirmedIds: string[];
  declinedIds: string[];
  currentCharacterId: string | null;
  respondingCharId: string | null;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'select', slot: SWSlotRef): void;
  (e: 'unassign', slot: SWSlotRef): void;
  (e: 'respond', action: RespondAction, characterId: string): void;
  (e: 'dragstart', event: DragEvent, slot: SWSlotRef): void;
  (e: 'dragover', event: DragEvent, slot: SWSlotRef): void;
  (e: 'dragleave'): void;
  (e: 'drop', slot: SWSlotRef): void;
  (e: 'dragend'): void;
}>();

// Esta pantalla muestra la categoría en minúsculas ("Batalla sublime")
const label = computed(() => swCategoryLabel(props.categoryName).toLowerCase());

const assignedCount = computed(() => {
  let assigned = 0;
  for (const match of props.matches ?? []) {
    for (const grp of ['group1', 'group2'] as const) {
      assigned += (match[grp]?.character ?? []).filter(Boolean).length;
    }
  }
  return assigned;
});

function slotRef(matchIdx: number, group: Group, memberIndex: number): SWSlotRef {
  return { cat: props.categoryName, matchIdx, group, memberIndex };
}

function slotKey(matchIdx: number, group: Group, memberIndex: number) {
  return swSlotKey(slotRef(matchIdx, group, memberIndex));
}

function groupAvgScore(chars: any[]): string {
  const scored = (chars ?? []).filter((c: any) => c?.score != null);
  if (!scored.length) return '—';
  const avg = scored.reduce((s: number, c: any) => s + c.score, 0) / scored.length;
  return avg.toLocaleString('es', { maximumFractionDigits: 0 });
}
</script>

<template>
  <div class="battle-card">
    <div class="battle-card-header" @click="emit('toggle')">
      <div class="battle-card-meta">
        <i class="fas fa-swords"></i>
        <span class="battle-card-name">Batalla {{ label }}</span>
        <span class="battle-card-count">{{ assignedCount }}/24</span>
      </div>
      <button class="btn-expand" @click.stop="emit('toggle')">
        <i :class="expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </button>
    </div>

    <div v-if="expanded" class="battle-card-body">
      <div v-for="(match, matchIndex) in matches" :key="matchIndex" class="battle-match">
        <h5 class="match-title">
          Partida {{ matchIndex + 1 }}
          <span class="group-avg-score">⌀ {{ groupAvgScore([...match.group1.character, ...match.group2.character]) }}</span>
        </h5>
        <div class="match-groups">
          <div v-for="grp in (['group1', 'group2'] as const)" :key="grp" class="group">
            <label><h5>{{ grp === 'group1' ? 'Grupo 1' : 'Grupo 2' }}</h5></label>
            <div class="character-cards-grid">
              <div
                v-for="n in 4"
                :key="n"
                class="drag-slot"
                :class="{
                  'is-dragging': dragSourceKey === slotKey(matchIndex, grp, n - 1),
                  'drag-over':   dragOverKey === slotKey(matchIndex, grp, n - 1)
                }"
                :draggable="!!match[grp].character[n - 1]"
                @dragstart="emit('dragstart', $event, slotRef(matchIndex, grp, n - 1))"
                @dragover.prevent="emit('dragover', $event, slotRef(matchIndex, grp, n - 1))"
                @dragleave="emit('dragleave')"
                @drop="emit('drop', slotRef(matchIndex, grp, n - 1))"
                @dragend="emit('dragend')"
              >
                <ShadowWarMemberCard
                  :character="match[grp].character[n - 1]"
                  :show-unassign-button="!!match[grp].character[n - 1]"
                  :confirmed-ids="confirmedIds"
                  :declined-ids="declinedIds"
                  :can-confirm="String(match[grp].character[n - 1]?._id) === currentCharacterId"
                  :confirming="respondingCharId === String(match[grp].character[n - 1]?._id)"
                  @click="emit('select', slotRef(matchIndex, grp, n - 1))"
                  @unassign="emit('unassign', slotRef(matchIndex, grp, n - 1))"
                  @respond="(action) => emit('respond', action, String(match[grp].character[n - 1]?._id))"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./SWBattleCategoryCard.scss" />
