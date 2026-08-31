<style scoped lang="scss" src="./ClanMemberCard.scss" />
<script setup lang="ts">
import { classes } from '../../../../middlewares/misc/const';

defineProps<{ char: any }>();

function getClassImage(value: string) { return classes.find(c => c.value === value)?.image ?? ''; }
function getClassName(value: string)  { return classes.find(c => c.value === value)?.name ?? value; }

function roleLabel(r: string) {
  return r === 'leader' ? 'Líder' : r === 'officer' ? 'Oficial' : 'Miembro';
}

function formatDate(d: string | Date) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
</script>

<template>
  <div class="list-container ex-member-row">
    <span class="status-container">
      <i class="fas fa-user-slash ex-icon" title="Exmiembro"></i>
    </span>
    <span class="name-cell sticky-col">
      <p>{{ char.name }}</p>
      <small class="ex-date">Salió {{ formatDate(char.leftAt) }}</small>
    </span>
    <span>
      <span
        class="role-badge ex-role"
        :class="char.role"
        :title="char.expulsionReason ? `Motivo: ${char.expulsionReason}` : ''"
      >{{ roleLabel(char.role) }}<i v-if="char.expulsionReason" class="fas fa-quote-right ex-reason-icon"></i></span>
    </span>
    <span>
      <img v-if="char.currentClass && getClassImage(char.currentClass)"
        :src="getClassImage(char.currentClass)" :alt="getClassName(char.currentClass)"
        :title="getClassName(char.currentClass)" width="30" />
      <span v-else class="no-class">—</span>
    </span>
    <span class="score-text">
      {{ (char.score ?? 0) > 0 ? (char.score ?? 0).toLocaleString('es') : '—' }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.ex-member-row {
  opacity: .65;
}

.ex-icon {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, .3);
}

.ex-date {
  font-size: .68rem;
  color: rgba(255, 255, 255, .35);
}

.ex-role {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
}

.ex-reason-icon {
  font-size: .62rem;
  opacity: .8;
}

.score-text {
  font-size: .78rem;
  color: rgba(255, 255, 255, .5);
}
</style>
