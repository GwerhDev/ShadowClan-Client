<script setup lang="ts">
import ShadowWarMemberCard from '../ShadowWarManagement/ShadowWarMemberCard.vue';
import { AT_GROUP_SIZES, ATGroup, ATRoster } from '../../../composables/useAccursedTowerRoster';

type RespondAction = 'confirm' | 'pending' | 'decline';

/** Grupos 1, 2 (×4) y 3 (×2) de la formación editable de una Torre Maldita. */
defineProps<{
  roster: ATRoster;
  dragSourceKey: string | null;
  dragOverKey: string | null;
  confirmedIds: string[];
  declinedIds: string[];
  currentCharacterId: string | null;
  respondingCharId: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', group: ATGroup, index: number): void;
  (e: 'unassign', group: ATGroup, index: number): void;
  (e: 'respond', action: RespondAction, characterId: string): void;
  (e: 'dragstart', event: DragEvent, group: ATGroup, index: number): void;
  (e: 'dragover', event: DragEvent, group: ATGroup, index: number): void;
  (e: 'dragleave'): void;
  (e: 'drop', group: ATGroup, index: number): void;
  (e: 'dragend'): void;
}>();

const slotKey = (group: string, index: number) => `${group}-${index}`;

const sections: { group: ATGroup; title: string; extraClass: string; gridClass: string }[] = [
  { group: 'group1', title: 'Grupo 1', extraClass: '',               gridClass: 'cards-grid' },
  { group: 'group2', title: 'Grupo 2', extraClass: '',               gridClass: 'cards-grid' },
  { group: 'group3', title: 'Grupo 3', extraClass: 'group3-section', gridClass: 'cards-grid cards-grid--2' },
];
</script>

<template>
  <div class="groups-layout">
    <div v-for="sec in sections" :key="sec.group" class="group-section" :class="sec.extraClass">
      <h5>{{ sec.title }} <span class="size-badge">×{{ AT_GROUP_SIZES[sec.group] }}</span></h5>
      <div :class="sec.gridClass">
        <div
          v-for="n in AT_GROUP_SIZES[sec.group]"
          :key="n"
          class="drag-slot"
          :class="{
            'is-dragging': dragSourceKey === slotKey(sec.group, n-1),
            'drag-over':   dragOverKey === slotKey(sec.group, n-1)
          }"
          :draggable="!!roster[sec.group][n-1]"
          @dragstart="emit('dragstart', $event, sec.group, n-1)"
          @dragover.prevent="emit('dragover', $event, sec.group, n-1)"
          @dragleave="emit('dragleave')"
          @drop="emit('drop', sec.group, n-1)"
          @dragend="emit('dragend')"
        >
          <ShadowWarMemberCard
            :character="roster[sec.group][n-1]"
            :show-unassign-button="!!roster[sec.group][n-1]"
            :confirmed-ids="confirmedIds"
            :declined-ids="declinedIds"
            :can-confirm="String(roster[sec.group][n-1]?._id) === currentCharacterId"
            :confirming="respondingCharId === String(roster[sec.group][n-1]?._id)"
            @click="emit('select', sec.group, n-1)"
            @unassign="emit('unassign', sec.group, n-1)"
            @respond="(action) => emit('respond', action, String(roster[sec.group][n-1]?._id))"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./ATRosterGroups.scss" />
