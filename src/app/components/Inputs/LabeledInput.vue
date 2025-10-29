<style scoped lang="scss" src="./LabeledInput.scss" />
<script setup lang="ts">
defineProps<{
  label: string,
  id: string,
  modelValue?: string | number | null | undefined,
  type?: string,
  disabled?: boolean,
  required?: boolean,
}>()

const emit = defineEmits(['update:modelValue'])

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <span class="labeled-input-container">
    <label :for="id">{{ label }}</label>
    <input :id="id" :name="id" :value="modelValue" @input="onInput" :required="required" :disabled="disabled"
      :type="type || 'text'">
  </span>
</template>
