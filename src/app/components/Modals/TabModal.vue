<script setup lang="ts">
import { ref } from 'vue';
import diabloImg from '../../../assets/png/shadowclan-icon.png';

interface Tab {
  key: string;
  label: string;
  icon?: string;
}

const props = defineProps<{
  title: string;
  tabs: Tab[];
  defaultTab?: string;
}>();

defineEmits(['close']);

const activeTab = ref(props.defaultTab ?? props.tabs[0]?.key ?? '');
</script>

<template>
  <Teleport to="body">
    <div class="tab-modal-overlay" @click.self="$emit('close')">
      <div class="tab-modal-container">

        <div class="tab-modal-header">
          <img :src="diabloImg" alt="" class="tab-modal-header__icon" />
          <h2 class="tab-modal-header__title">{{ title }}</h2>
          <button class="tab-modal-header__close" @click="$emit('close')">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="tab-modal-body">
          <nav class="tab-modal-nav">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :class="['tab-nav-btn', { 'tab-nav-btn--active': activeTab === tab.key }]"
              @click="activeTab = tab.key"
            >
              <i v-if="tab.icon" :class="tab.icon"></i>
              <span>{{ tab.label }}</span>
            </button>
          </nav>

          <div class="tab-modal-content">
            <div
              v-for="tab in tabs"
              :key="tab.key"
              v-show="activeTab === tab.key"
              class="tab-panel"
            >
              <slot :name="tab.key" />
            </div>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.tab-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(0, 0, 0, .55);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  padding: 2rem 1.5rem;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
  }
}

.tab-modal-container {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 820px;
  max-height: 85vh;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  background: var(--color-primary-bg);
  border: 1px solid rgba(255, 255, 255, .1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, .5);
  padding: 1.75rem;

  @media (max-width: 768px) {
    max-width: 100%;
    max-height: 92vh;
    border-radius: 14px 14px 0 0;
    padding: 1.25rem;
  }
}

.tab-modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-shrink: 0;

  &__icon {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: 1rem;
    letter-spacing: .08em;
    color: rgba(255, 255, 255, .85);
    flex: 1;
  }

  &__close {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, .12);
    padding: 0;
    border-radius: 6px;
    width: 32px;
    height: 32px;
    font-size: .9rem;
    cursor: pointer;
    color: rgba(255, 255, 255, .5);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background .15s, border-color .15s, color .15s;

    &:hover {
      background: rgba(255, 255, 255, .08);
      border-color: rgba(255, 255, 255, .25);
      color: rgba(255, 255, 255, .9);
    }
  }
}

.tab-modal-body {
  display: flex;
  gap: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, .07);
}

.tab-modal-nav {
  display: flex;
  flex-direction: column;
  width: 128px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, .2);
  border-right: 1px solid rgba(255, 255, 255, .07);
  padding: .5rem 0;
  gap: 2px;
}

.tab-nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  padding: .9rem .5rem;
  background: transparent;
  border: none;
  border-left: 2px solid transparent;
  cursor: pointer;
  color: rgba(255, 255, 255, .35);
  font-size: .68rem;
  letter-spacing: .06em;
  text-transform: uppercase;
  transition: color .15s, background .15s, border-color .15s;
  text-align: center;
  width: 100%;

  i {
    font-size: 1.1rem;
  }

  span {
    line-height: 1.2;
  }

  &:hover {
    color: rgba(255, 255, 255, .6);
    background: rgba(255, 255, 255, .03);
  }

  &--active {
    color: rgb(227, 210, 168);
    background: rgba(227, 210, 168, .06);
    border-left-color: rgb(227, 210, 168);
  }
}

.tab-modal-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-panel {
  padding: 1.25rem;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
