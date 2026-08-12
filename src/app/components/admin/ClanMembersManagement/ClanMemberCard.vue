<style scoped lang="scss" src="./ClanMemberCard.scss" />
<script setup lang="ts">
import { classes } from '../../../../middlewares/misc/const';

const props = defineProps<{
  char: any;
  role: 'leader' | 'officer' | 'member';
}>();

const emit = defineEmits(['open-profile']);

function getClassImage(value: string) { return classes.find(c => c.value === value)?.image ?? ''; }
function getClassName(value: string)  { return classes.find(c => c.value === value)?.name ?? value; }

function styleStatus(s: string) {
  if (s === 'activo')    return { backgroundColor: '#99d499' };
  if (s === 'inactivo')  return { backgroundColor: '#b67f75' };
  if (s === 'retirado')  return { backgroundColor: '#888888' };
  if (s === 'pendiente') return { backgroundColor: '#eaec72' };
  return { backgroundColor: '#888888' };
}
function roleLabel(r: string) {
  return r === 'leader' ? 'Líder' : r === 'officer' ? 'Oficial' : 'Miembro';
}
</script>

<template>
  <div class="list-container list-container--clickable" @click="emit('open-profile', char)">
    <span class="status-container">
      <div class="status-image">
        <img src="../../../../assets/svg/profile-icon.svg" alt="" />
        <span class="status" :style="styleStatus(char.memberStatus ?? 'activo')"></span>
      </div>
    </span>
    <span class="name-cell sticky-col"><p>{{ char.name }}</p></span>
    <span><span :class="['role-badge', role]">{{ roleLabel(role) }}</span></span>
    <span>
      <img v-if="char.currentClass && getClassImage(char.currentClass)"
        :src="getClassImage(char.currentClass)" :alt="getClassName(char.currentClass)"
        :title="getClassName(char.currentClass)" width="30" />
      <span v-else class="no-class">—</span>
    </span>
    <span class="score-text">
      {{ (props.char.score ?? 0) > 0 ? (props.char.score ?? 0).toLocaleString('es') : '—' }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.list-container--clickable {
  cursor: pointer;
  transition: background .15s, border-color .15s;

  &:hover {
    background: rgba(255, 255, 255, .04);
    border-color: rgba(255, 255, 255, .15);
  }
}

.score-text {
  font-size: .78rem;
  color: rgba(255, 255, 255, .5);
}
</style>
