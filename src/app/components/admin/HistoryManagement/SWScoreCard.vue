<script setup lang="ts">
import { computed } from 'vue';
import { swCategoryPoints } from '../../../../middlewares/misc/shadowWar';

/** Tarjeta de puntaje de una Guerra Sombría (puntos ganados - perdidos / total). */
const props = defineProps<{
  battle: Record<string, any[]> | undefined | null;
}>();

const scorePoints = computed(() => {
  const battle = props.battle;
  if (!battle) return { won: 0, lost: 0, total: 0 };
  let won = 0, lost = 0, total = 0;
  for (const [cat, matches] of Object.entries(battle) as [string, any[]][]) {
    const pts = swCategoryPoints(cat);
    for (const m of matches) {
      total += pts;
      if (m.result === 'victory')     won  += pts;
      else if (m.result === 'defeat') lost += pts;
    }
  }
  return { won, lost, total };
});
</script>

<template>
  <div class="stat-card">
    <span class="stat-label">Puntaje</span>
    <div class="stat-value-row">
      <span class="score-win">{{ scorePoints.won }}</span>
      <span class="score-sep">-</span>
      <span class="score-lose">{{ scorePoints.lost }}</span>
    </div>
    <span class="score-total">/ {{ scorePoints.total }} pts</span>
  </div>
</template>

<style scoped lang="scss" src="./SWScoreCard.scss" />
