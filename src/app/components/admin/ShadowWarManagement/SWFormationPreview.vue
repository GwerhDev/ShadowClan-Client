<script setup lang="ts">
const props = defineProps<{
  battle: Record<string, any[]>;
  members: any[];
}>();

const TIERS = [
  { key: 'exalted', label: 'Sublime',   pts: '8pts' },
  { key: 'eminent', label: 'Eminente',  pts: '4pts' },
  { key: 'famed',   label: 'Célebre',   pts: '2pts' },
  { key: 'proud',   label: 'Imponente', pts: '1pt'  },
];

function resolveName(id: any): string {
  if (!id) return '—';
  const raw = typeof id === 'object' ? (id._id ?? id) : id;
  const found = props.members.find((m: any) => String(m._id) === String(raw));
  if (found) return found.name ?? '—';
  return String(raw).slice(-6);
}

function charList(group: any): (string | null)[] {
  const chars = group?.character ?? [];
  const out: (string | null)[] = chars.map((c: any) => c ? resolveName(c) : null);
  while (out.length < 4) out.push(null);
  return out.slice(0, 4);
}
</script>

<template>
  <div class="swfp">
    <div v-for="tier in TIERS" :key="tier.key" class="swfp__tier">
      <div class="swfp__tier-head">
        <span class="swfp__tier-label">{{ tier.label }}</span>
        <span class="swfp__tier-pts">{{ tier.pts }}</span>
      </div>
      <div class="swfp__matches">
        <div v-for="(match, mi) in (battle[tier.key] ?? [])" :key="mi" class="swfp__match">
          <span class="swfp__match-num">P{{ mi + 1 }}</span>
          <div class="swfp__chars">
            <template v-for="(name, ci) in [...charList(match.group1), ...charList(match.group2)]" :key="ci">
              <span :class="['swfp__char', { 'swfp__char--empty': !name, 'swfp__char--sep': ci === 3 }]">
                {{ name ?? '—' }}
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.swfp {
  display: flex;
  flex-direction: column;
  gap: .5rem;

  &__tier {
    display: flex;
    flex-direction: column;
    gap: .25rem;
  }

  &__tier-head {
    display: flex;
    align-items: center;
    gap: .4rem;
  }

  &__tier-label {
    font-size: .65rem;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, .5);
  }

  &__tier-pts {
    font-size: .6rem;
    color: rgb(227, 210, 168);
    background: rgba(227, 210, 168, .08);
    border: 1px solid rgba(227, 210, 168, .2);
    border-radius: 3px;
    padding: 0 .35rem;
    line-height: 1.6;
  }

  &__matches {
    display: flex;
    gap: .4rem;
  }

  &__match {
    flex: 1;
    background: rgba(0, 0, 0, .2);
    border: 1px solid rgba(255, 255, 255, .06);
    border-radius: 5px;
    padding: .35rem .4rem;
    display: flex;
    flex-direction: column;
    gap: .25rem;
  }

  &__match-num {
    font-size: .58rem;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: rgba(255, 255, 255, .3);
  }

  &__chars {
    display: flex;
    flex-direction: column;
    gap: .1rem;
  }

  &__char {
    font-size: .68rem;
    color: rgba(255, 255, 255, .75);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;

    &--empty {
      color: rgba(255, 255, 255, .2);
    }

    &--sep {
      margin-top: .2rem;
      padding-top: .2rem;
      border-top: 1px solid rgba(255, 255, 255, .07);
    }
  }
}
</style>
