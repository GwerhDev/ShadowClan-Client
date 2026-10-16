<script setup lang="ts">
import { computed } from 'vue';
import ShadowWarMemberCard from '../ShadowWarManagement/ShadowWarMemberCard.vue';
import { translateBattle, translateResult } from '../../../../helpers/lists';
import { swCategoryPoints } from '../../../../middlewares/misc/shadowWar';
import { swSlotKey, SWSlotRef } from '../../../composables/useFormationEdit';

type Group = 'group1' | 'group2';

/**
 * Tarjeta colapsable de una categoría de batalla en el detalle del historial.
 * Al expandirse entra en modo edición de formación (buffer editable en el padre).
 */
const props = defineProps<{
  battleType: string;
  /** Partidas guardadas (solo lectura). */
  matches: any[];
  /** Copia editable de las partidas (solo cuando `editing`). */
  buffer: any[] | undefined;
  editing: boolean;
  expanded: boolean;
  saving: boolean;
  dragSourceKey: string | null;
  dragOverKey: string | null;
  confirmedIds: string[];
  declinedIds: string[];
  assignedIds: string[];
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'set-result', matchIdx: number, result: string): void;
  (e: 'select', slot: SWSlotRef): void;
  (e: 'unassign', slot: SWSlotRef): void;
  (e: 'dragstart', event: DragEvent, slot: SWSlotRef): void;
  (e: 'dragover', event: DragEvent, slot: SWSlotRef): void;
  (e: 'dragleave'): void;
  (e: 'drop', slot: SWSlotRef): void;
  (e: 'dragend'): void;
}>();

const matchResults = [
  { value: 'victory', text: 'Victoria' },
  { value: 'defeat',  text: 'Derrota'  },
  { value: 'draw',    text: 'Empate'   },
  { value: 'pending', text: 'Pendiente'},
];

const confirmedSet = computed(() => new Set(props.confirmedIds));

const visibleMatches = computed(() => (props.editing ? props.buffer : props.matches) ?? []);

const scoreSummary = computed(() => {
  const pts    = swCategoryPoints(props.battleType);
  const total  = props.matches.length * pts;
  const earned = props.matches.filter(m => m.result === 'victory').length * pts;
  return `${earned} / ${total} pts`;
});

function absenceCount(match: any): number {
  const chars = [...(match.group1?.character ?? []), ...(match.group2?.character ?? [])];
  return chars.filter(c => c && !confirmedSet.value.has(String(c?._id ?? c))).length;
}

function slotRef(matchIdx: number, group: Group, memberIndex: number): SWSlotRef {
  return { cat: props.battleType, matchIdx, group, memberIndex };
}

function slotKey(matchIdx: number, group: Group, memberIndex: number) {
  return swSlotKey(slotRef(matchIdx, group, memberIndex));
}

function bufferChar(matchIdx: number, group: Group, memberIndex: number) {
  return props.buffer?.[matchIdx]?.[group]?.character?.[memberIndex];
}
</script>

<template>
  <div class="battle-card">
    <div class="battle-card-header" @click="emit('toggle')">
      <div class="battle-card-meta">
        <i class="fas fa-swords"></i>
        <span class="battle-card-name">Batalla {{ translateBattle(battleType) }}</span>
        <span class="battle-card-count">{{ scoreSummary }}</span>
      </div>
      <div class="battle-card-actions" @click.stop>
        <i v-if="saving && editing" class="fas fa-circle-notch fa-spin battle-saving-icon"></i>
        <button class="btn-expand" @click="emit('toggle')">
          <i :class="expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </button>
      </div>
    </div>
    <div v-if="expanded" class="battle-card-body">
      <div v-for="(match, mIdx) in visibleMatches" :key="mIdx" class="battle-match">
        <h5 class="match-title">
          Partida {{ mIdx + 1 }}
          <div class="match-title-actions">
            <span v-if="absenceCount(match) > 0" class="absence-badge">
              <i class="fas fa-user-slash"></i> {{ absenceCount(match) }}
            </span>
            <select
              v-if="editing"
              :value="match.result"
              class="match-result-select"
              @change="emit('set-result', mIdx, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="opt in matchResults" :key="opt.value" :value="opt.value">{{ opt.text }}</option>
            </select>
            <span v-else :class="['result-chip', `result-${match.result}`]">{{ translateResult(match.result) }}</span>
          </div>
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
                  'is-dragging': dragSourceKey === slotKey(mIdx, grp, n - 1),
                  'drag-over':   dragOverKey === slotKey(mIdx, grp, n - 1)
                }"
                :draggable="editing && !!bufferChar(mIdx, grp, n - 1)"
                @dragstart="emit('dragstart', $event, slotRef(mIdx, grp, n - 1))"
                @dragover.prevent="emit('dragover', $event, slotRef(mIdx, grp, n - 1))"
                @dragleave="emit('dragleave')"
                @drop="emit('drop', slotRef(mIdx, grp, n - 1))"
                @dragend="emit('dragend')"
              >
                <ShadowWarMemberCard
                  :character="editing ? bufferChar(mIdx, grp, n - 1) : match[grp].character[n - 1]"
                  :show-unassign-button="editing && !!bufferChar(mIdx, grp, n - 1)"
                  :readonly="!editing"
                  :confirmed-ids="confirmedIds"
                  :declined-ids="declinedIds"
                  :assigned-ids="assignedIds"
                  @click="editing ? emit('select', slotRef(mIdx, grp, n - 1)) : undefined"
                  @unassign="emit('unassign', slotRef(mIdx, grp, n - 1))"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./HistoryBattleCard.scss" />
