<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: string;   // optional image URL
}

const props = defineProps<{
  modelValue: string | number | null | undefined;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen    = ref(false);
const triggerEl = ref<HTMLElement | null>(null);
const dropPos   = ref({ top: 0, left: 0, width: 0 });

const selectedOption = computed(() =>
  props.options.find(o => String(o.value) === String(props.modelValue)) ?? null
);

const hasValue = computed(() =>
  props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined
);

function toggle(e: MouseEvent) {
  if (props.disabled) return;
  e.stopPropagation();
  if (!isOpen.value) {
    const rect = triggerEl.value!.getBoundingClientRect();
    dropPos.value = { top: rect.bottom + 2, left: rect.left, width: rect.width };
  }
  isOpen.value = !isOpen.value;
}

function select(value: string | number) {
  emit('update:modelValue', value);
  emit('change', value);
  isOpen.value = false;
}

function close() { isOpen.value = false; }

onMounted(()   => document.addEventListener('click', close));
onUnmounted(() => document.removeEventListener('click', close));
</script>

<template>
  <div
    ref="triggerEl"
    class="custom-select"
    :class="{ open: isOpen, disabled }"
    @click="toggle"
  >
    <label v-if="label" class="custom-select-label">{{ label }}</label>

    <div class="custom-select-value" :class="{ placeholder: !hasValue }">
      <template v-if="hasValue && selectedOption">
        <img v-if="selectedOption.icon" :src="selectedOption.icon" class="csel-icon" alt="" />
        <span>{{ selectedOption.label }}</span>
      </template>
      <span v-else>{{ placeholder ?? '—' }}</span>
      <i class="fas fa-chevron-down custom-select-chevron" :class="{ rotated: isOpen }"></i>
    </div>

    <Teleport to="body">
      <ul
        v-if="isOpen"
        class="custom-select-dropdown"
        :style="{ top: dropPos.top + 'px', left: dropPos.left + 'px', width: dropPos.width + 'px' }"
        @click.stop
      >
        <li
          v-for="opt in options"
          :key="opt.value"
          class="custom-select-option"
          :class="{ selected: String(opt.value) === String(modelValue) }"
          @click="select(opt.value)"
        >
          <img v-if="opt.icon" :src="opt.icon" class="csel-icon" alt="" />
          <span>{{ opt.label }}</span>
        </li>
      </ul>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.custom-select {
  position: relative;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color .15s;
  user-select: none;
  min-width: 0;

  &:hover:not(.disabled) { border-color: rgba(255, 255, 255, .2); }

  &.open {
    border-color: rgba(227, 210, 168, .4);
    border-radius: 8px 8px 0 0;
  }

  &.disabled { opacity: .45; cursor: default; }
}

.custom-select-label {
  padding: .3rem .75rem 0;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .4);
  cursor: inherit;
  pointer-events: none;
}

.custom-select-value {
  display: flex;
  align-items: center;
  gap: .45rem;
  padding: .3rem .75rem .45rem;
  font-family: 'Cinzel', serif;
  font-size: .9rem;
  color: rgba(255, 255, 255, .85);
  min-width: 0;

  &.placeholder span { color: rgba(255, 255, 255, .3); }

  span {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.custom-select-chevron {
  font-size: .65rem;
  color: rgba(255, 255, 255, .35);
  flex-shrink: 0;
  transition: transform .15s;
  margin-left: auto;

  &.rotated { transform: rotate(180deg); }
}

.csel-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  object-fit: contain;
}
</style>

<style lang="scss">
.custom-select-dropdown {
  position: fixed;
  z-index: 9998;
  margin: 0;
  padding: .25rem 0;
  list-style: none;
  background: var(--color-primary-bg);
  border: 1px solid rgba(227, 210, 168, .25);
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .5);
  max-height: 240px;
  overflow-y: auto;

  .custom-select-option {
    display: flex;
    align-items: center;
    gap: .55rem;
    padding: .45rem .75rem;
    font-family: 'Cinzel', serif;
    font-size: .85rem;
    color: rgba(255, 255, 255, .7);
    cursor: pointer;
    transition: background .1s, color .1s;

    &:hover {
      background: rgba(255, 255, 255, .07);
      color: var(--color-app-white);
    }

    &.selected {
      color: rgb(227, 210, 168);
      background: rgba(227, 210, 168, .06);
    }

    .csel-icon {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      object-fit: contain;
    }
  }
}
</style>
