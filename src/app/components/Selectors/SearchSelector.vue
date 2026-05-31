<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Clan } from '../../../interfaces';

const props = defineProps<{
  modelValue: string;
  options?: Clan[];
  fetchFn?: (q: string) => Promise<Clan[]>;
  placeholder?: string;
  label?: string;
  createLabel?: string;
  selectedLabel?: string;
}>();

const emit = defineEmits(['update:modelValue', 'select', 'clear', 'create']);

const searchQuery          = ref('');
const showDropdown         = ref(false);
const internalSelectedName = ref('');
const isSelected           = ref(false);
const fetchedOptions       = ref<Clan[]>([]);
const isFetching           = ref(false);
let   fetchTimer: ReturnType<typeof setTimeout> | null = null;

const filteredOptions = computed(() => {
  if (props.fetchFn) return fetchedOptions.value;
  if (!props.options || !searchQuery.value) return [];
  const q = searchQuery.value.toLowerCase();
  return props.options.filter((o: any) => o.name.toLowerCase().includes(q));
});

const showDropdownContent = computed(() =>
  showDropdown.value && (searchQuery.value.length > 0 || !!props.fetchFn && isFetching.value)
);

watch(() => props.modelValue, (newValue) => {
  const pool = props.fetchFn ? fetchedOptions.value : (props.options ?? []);
  if (newValue) {
    const found = pool.find((o: any) => o._id === newValue);
    if (found) {
      internalSelectedName.value = (found as any).name ?? '';
    } else if (props.selectedLabel) {
      internalSelectedName.value = props.selectedLabel;
    }
    isSelected.value = true;
  } else {
    internalSelectedName.value = '';
    isSelected.value = false;
  }
}, { immediate: true });

watch(() => props.selectedLabel, (label) => {
  if (label && isSelected.value && !internalSelectedName.value) {
    internalSelectedName.value = label;
  }
});

const handleFocus = () => {
  // Only show in static-options mode when there's already a query
  if (!props.fetchFn && !isSelected.value && searchQuery.value) {
    showDropdown.value = true;
  }
};

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false;
    if (!props.modelValue && searchQuery.value) searchQuery.value = '';
  }, 150);
};

const handleInputChange = () => {
  if (isSelected.value) {
    emit('update:modelValue', '');
    isSelected.value = false;
    fetchedOptions.value = [];
  }
  showDropdown.value = true;

  if (props.fetchFn) {
    if (fetchTimer) clearTimeout(fetchTimer);
    if (searchQuery.value.trim().length < 3) {
      fetchedOptions.value = [];
      return;
    }
    fetchTimer = setTimeout(async () => {
      isFetching.value = true;
      try {
        fetchedOptions.value = await props.fetchFn!(searchQuery.value.trim());
      } finally {
        isFetching.value = false;
      }
    }, 1000);
  }
};

const selectOption = (option: any) => {
  emit('update:modelValue', option._id);
  emit('select', option);
  internalSelectedName.value = option.name;
  searchQuery.value = '';
  showDropdown.value = false;
  isSelected.value = true;
};

const clearSelection = () => {
  emit('update:modelValue', '');
  emit('clear');
  internalSelectedName.value = '';
  searchQuery.value = '';
  isSelected.value = false;
  showDropdown.value = false;
  fetchedOptions.value = [];
};

const inputValue = computed({
  get: () => isSelected.value ? internalSelectedName.value : searchQuery.value,
  set: (val) => { searchQuery.value = val; }
});
</script>

<template>
  <div class="search-selector-outter-container">
    <div class="search-selector-container">
      <label v-if="label">{{ label }}</label>
      <div class="input-wrapper">
        <input
          type="text"
          v-model="inputValue"
          :placeholder="placeholder"
          @focus="handleFocus"
          @blur="handleBlur"
          @input="handleInputChange"
          :readonly="isSelected"
        />
        <button title="Cambiar" v-if="isSelected" @click="clearSelection" class="clear-button">
          <i class="fas fa-exchange"></i>
        </button>
      </div>

      <div v-if="showDropdownContent" class="suggestions-dropdown">
        <div v-if="isFetching" class="suggestion-loading">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <template v-else>
          <div
            v-for="option in filteredOptions"
            :key="option._id"
            @mousedown.prevent="selectOption(option)"
            class="suggestion-item"
          >
            {{ option.name }}
          </div>
          <template v-if="!filteredOptions.length && searchQuery && !isFetching">
            <div class="suggestion-empty">No se encontraron resultados.</div>
            <div
              v-if="createLabel"
              @mousedown.prevent="$emit('create', searchQuery)"
              class="suggestion-item suggestion-item--create"
            >
              <i class="fas fa-plus"></i> {{ createLabel }}
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./SearchSelector.scss"></style>
