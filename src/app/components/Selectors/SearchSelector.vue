<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Option {
  _id: string;
  name: string;
}

const props = defineProps<{
  modelValue: string; // The currently selected value (clan ID)
  options: Option[]; // All available options (clans)
  placeholder?: string;
  label?: string;
}>();

const emit = defineEmits(['update:modelValue', 'select']);

const searchQuery = ref('');
const showSuggestions = ref(false);
const internalSelectedName = ref(''); // To display the selected name in the input
const isSelected = ref(false); // New ref to track if an option is selected

// Filter options based on search query
const filteredOptions = computed(() => {
  if (!searchQuery.value) {
    return props.options;
  }
  const query = searchQuery.value.toLowerCase();
  return props.options.filter(option => option.name.toLowerCase().includes(query));
});

// Update internalSelectedName and isSelected when modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    const selectedOption = props.options.find(option => option._id === newValue);
    internalSelectedName.value = selectedOption ? selectedOption.name : '';
    isSelected.value = !!selectedOption; // Set isSelected based on whether an option is found
  } else {
    internalSelectedName.value = '';
    isSelected.value = false;
  }
}, { immediate: true });

// Handle input focus/blur to show/hide suggestions
const handleFocus = () => {
  if (!isSelected.value) { // Only show suggestions if nothing is selected
    showSuggestions.value = true;
  }
};

const handleBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false;
    // If nothing is selected and search query is not empty, clear it
    if (!props.modelValue && searchQuery.value) {
      searchQuery.value = '';
    }
  }, 150);
};

// Handle selection from suggestions
const selectOption = (option: Option) => {
  emit('update:modelValue', option._id);
  emit('select', option);
  internalSelectedName.value = option.name;
  searchQuery.value = ''; // Clear search query after selection
  showSuggestions.value = false;
  isSelected.value = true; // Mark as selected
};

// Handle input change (for search)
const handleInputChange = () => {
  if (isSelected.value) { // If something was selected, clear it when typing
    emit('update:modelValue', '');
    isSelected.value = false;
  }
  showSuggestions.value = true; // Ensure suggestions are shown when typing
};

// Clear the current selection
const clearSelection = () => {
  emit('update:modelValue', '');
  internalSelectedName.value = '';
  searchQuery.value = '';
  isSelected.value = false;
  showSuggestions.value = false; // Hide suggestions after clearing
};

// Display selected name in input, or search query if typing
const inputValue = computed({
  get: () => isSelected.value ? internalSelectedName.value : searchQuery.value,
  set: (val) => {
    searchQuery.value = val;
  }
});

</script>

<template>
  <div class="search-selector-container">
    <label v-if="label"><h3>{{ label }}</h3></label>
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
      <button v-if="isSelected" @click="clearSelection" class="clear-button">
        <i class="fas fa-exchange"></i>
      </button>
    </div>
    <div v-if="showSuggestions && filteredOptions.length" class="suggestions-dropdown">
      <div
        v-for="option in filteredOptions"
        :key="option._id"
        @mousedown.prevent="selectOption(option)"
        class="suggestion-item"
      >
        {{ option.name }}
      </div>
    </div>
    <div v-else-if="showSuggestions && !filteredOptions.length && searchQuery" class="suggestions-dropdown">
      No se encontraron resultados.
    </div>
  </div>
</template>

<style scoped lang="scss" src="./SearchSelector.scss"></style>