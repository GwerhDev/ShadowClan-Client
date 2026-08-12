<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  armor:            number;
  armorPenetration: number;
  power:            number;
  resistance:       number;
  maxArmor:            number;
  maxArmorPenetration: number;
  maxPower:            number;
  maxResistance:       number;
  size?: number;
}>();

const S  = computed(() => props.size ?? 130);
const CX = computed(() => S.value / 2);
const CY = computed(() => S.value / 2);
const R  = computed(() => S.value * 0.37);

function norm(v: number, max: number): number {
  if (!max) return 0;
  return Math.min(1, Math.max(0, v / max));
}

// Axes: top = ARM, right = RES, bottom = PEN, left = POT
const pts = computed(() => {
  const cx = CX.value, cy = CY.value, r = R.value;
  return [
    { x: cx,                              y: cy - r * norm(props.armor,            props.maxArmor)            }, // TOP  — ARM
    { x: cx + r * norm(props.resistance,  props.maxResistance),  y: cy            }, // RIGHT — RES
    { x: cx,                              y: cy + r * norm(props.armorPenetration, props.maxArmorPenetration) }, // BOT  — PEN
    { x: cx - r * norm(props.power,       props.maxPower),       y: cy            }, // LEFT  — POT
  ];
});

const polygon = computed(() => pts.value.map(p => `${p.x},${p.y}`).join(' '));

function gridPolygon(pct: number): string {
  const cx = CX.value, cy = CY.value, r = R.value * pct;
  return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
}

const labelPad = 10;
const labels = computed(() => {
  const cx = CX.value, cy = CY.value, r = R.value;
  return [
    { text: 'ARM', x: cx,          y: cy - r - labelPad, anchor: 'middle' },
    { text: 'RES', x: cx + r + labelPad, y: cy + 3,     anchor: 'start'  },
    { text: 'PEN', x: cx,          y: cy + r + labelPad + 6, anchor: 'middle' },
    { text: 'POT', x: cx - r - labelPad, y: cy + 3,     anchor: 'end'    },
  ];
});
</script>

<template>
  <svg
    :width="S" :height="S"
    :viewBox="`0 0 ${S} ${S}`"
    class="stat-radar"
    style="overflow: visible; display: block;"
  >
    <!-- Grid diamonds -->
    <polygon
      v-for="pct in [0.25, 0.5, 0.75, 1]" :key="pct"
      :points="gridPolygon(pct)"
      fill="none"
      stroke="rgba(255,255,255,0.08)"
      stroke-width="1"
    />
    <!-- Axes -->
    <line :x1="CX" :y1="CY - R" :x2="CX" :y2="CY + R" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <line :x1="CX - R" :y1="CY" :x2="CX + R" :y2="CY" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <!-- Data polygon -->
    <polygon
      :points="polygon"
      fill="rgba(227,210,168,0.15)"
      stroke="rgba(227,210,168,0.75)"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <!-- Vertex dots -->
    <circle
      v-for="(p, i) in pts" :key="i"
      :cx="p.x" :cy="p.y"
      r="2.5"
      fill="rgba(227,210,168,0.9)"
    />
    <!-- Labels -->
    <text
      v-for="l in labels" :key="l.text"
      :x="l.x" :y="l.y"
      :text-anchor="l.anchor"
      class="radar-lbl"
    >{{ l.text }}</text>
  </svg>
</template>

<style scoped>
.radar-lbl {
  font-size: 9px;
  fill: rgba(255, 255, 255, 0.4);
  font-family: inherit;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
</style>
