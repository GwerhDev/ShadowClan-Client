<script setup lang="ts">
import { computed } from 'vue';
import ClassImage from '../../common/ClassImage.vue';
import { classes } from '../../../../middlewares/misc/const';

/** Modal con la nómina final (miembros asignados) de una Guerra Sombría. */
const props = defineProps<{
  battle: Record<string, any[]> | undefined | null;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const getClassName = (cls: string | undefined) => classes.find(c => c.value === cls)?.name ?? (cls ?? '');

const attendanceMembers = computed(() => {
  const battle = props.battle;
  if (!battle) return [];
  const seen = new Set<string>();
  const members: any[] = [];
  for (const matches of Object.values(battle) as any[][]) {
    for (const match of matches) {
      for (const grp of ['group1', 'group2']) {
        for (const char of match[grp]?.character ?? []) {
          if (!char) continue;
          const id = String(char._id ?? char);
          if (!seen.has(id)) { seen.add(id); members.push(char); }
        }
      }
    }
  }
  return members;
});
</script>

<template>
  <Teleport to="body">
    <div class="attendance-overlay" @click.self="emit('close')">
      <div class="attendance-modal">
        <div class="attendance-modal-header">
          <span class="attendance-modal-title">Asistencia</span>
          <button class="ctx-cancel-btn" @click="emit('close')"><i class="fas fa-times"></i></button>
        </div>
        <div class="attendance-modal-body">
          <div v-if="attendanceMembers.length === 0" class="attendance-empty">
            <i class="fas fa-users-slash"></i>
            <span>No hay miembros en la nómina final.</span>
          </div>
          <div v-for="member in attendanceMembers" :key="member._id" class="attendance-row">
            <ClassImage :current-class="member.currentClass" />
            <div class="attendance-member-info">
              <span class="attendance-member-name">{{ member.name }}</span>
              <span class="attendance-member-meta">{{ getClassName(member.currentClass) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss" src="./HistoryAttendanceModal.scss" />
