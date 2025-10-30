<style scoped lang="scss" src="./TabBar.scss" />
<script setup lang="ts">
import { useStore, AppStore } from '../../middlewares/store';
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';

const props = withDefaults(defineProps<{
  logged: Boolean,
  tabs: Array<{
    id: string;
    name: string;
    icon: string;
    length?: number;
    path: string;
    disabled?: boolean;
  }>,
}>(), {
  tabs: () => []
});

const store: AppStore = useStore();
const route = useRoute();
const router = useRouter();

const slider = ref<HTMLElement | null>(null);
const isDown = ref(false);
const startX = ref(0);
const scrollLeft = ref(0);

const scrollSlider = (direction: 'left' | 'right') => {
  if (slider.value) {
    const scrollAmount = slider.value.clientWidth / 4;
    if (direction === 'left') {
      slider.value.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      slider.value.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
};

onMounted(() => {
  if (slider.value && props.tabs.length > 4) {
    slider.value.addEventListener('mousedown', (e) => {
      isDown.value = true;
      slider.value?.classList.add('active');
      startX.value = e.pageX - (slider.value?.offsetLeft || 0);
      scrollLeft.value = slider.value?.scrollLeft || 0;
    });
    slider.value.addEventListener('mouseleave', () => {
      isDown.value = false;
      slider.value?.classList.remove('active');
    });
    slider.value.addEventListener('mouseup', () => {
      isDown.value = false;
      slider.value?.classList.remove('active');
    });
    slider.value.addEventListener('mousemove', (e) => {
      if (!isDown.value) return;
      e.preventDefault();
      const x = e.pageX - (slider.value?.offsetLeft || 0);
      const walk = (x - startX.value) * 2; //scroll-fast
      if (slider.value) {
        slider.value.scrollLeft = scrollLeft.value - walk;
      }
    });

    // Touch events for mobile
    slider.value.addEventListener('touchstart', (e) => {
      isDown.value = true;
      startX.value = e.touches[0].pageX - (slider.value?.offsetLeft || 0);
      scrollLeft.value = slider.value?.scrollLeft || 0;
    });
    slider.value.addEventListener('touchend', () => {
      isDown.value = false;
    });
    slider.value.addEventListener('touchmove', (e) => {
      if (!isDown.value) return;
      const x = e.touches[0].pageX - (slider.value?.offsetLeft || 0);
      const walk = (x - startX.value);
      if (slider.value) {
        slider.value.scrollLeft = scrollLeft.value - walk;
      }
    });
  }
});


function handleType(tab: { id: string; name: string; icon: string; length?: number; path: string; }) {
  router.push(tab.path);
};

function styleActive(path: string) {
  if (route.path === path) {
    return { backgroundColor: "var(--color-primary)" };
  }
  return {};
};

</script>

<template>
  <div class="container-tab">
    <button v-if="tabs.length > 4" class="slider-nav-button prev first" @click="scrollSlider('left')"><i class="fas fa-chevron-left icon-button-tab"></i></button>
    <ul ref="slider" :class="{ 'slider': tabs.length > 4 }">
      <li v-for="(tab, index) in tabs" :key="tab.id">
        <button
          :title="tab.name"
          :class="{ 'first': index === 0 && tabs.length <= 4, 'last': index === tabs.length - 1 && tabs.length <= 4, 'disabled': tab.disabled }"
          @click="handleType(tab)"
          :style="styleActive(tab.path)"
          :disabled="tab.disabled"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.name }}</span>
          <small v-if="store.currentUser.userBattleInfo.some(b => b.category === tab.id)"><i class="fas fa-user-shield user-battle-indicator"></i></small>
        </button>
      </li>
    </ul>
    <button v-if="tabs.length > 4" class="slider-nav-button next last" @click="scrollSlider('right')"><i class="fas fa-chevron-right icon-button-tab"></i></button>
  </div>
</template>
