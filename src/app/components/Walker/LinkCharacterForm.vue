<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '../../../middlewares/store';
import { classes } from '../../../middlewares/misc/const';
import { getCharacterByName } from '../../../middlewares/services';
import LabeledInput from '../Inputs/LabeledInput.vue';
import CharacterCard from '../Cards/CharacterCard.vue';

const emit = defineEmits(['done', 'cancel']);
const store: any = useStore();

const step = ref(1);
const characterName = ref('');
const characters = ref<any[]>([]);
const selectedCharacter = ref<any>(null);
const isLoading = ref(false);
let debounceTimer: any = null;

const formData = ref({
  name: '',
  resonance: null as number | null,
  currentClass: '',
});

const sliderContainer = ref<HTMLElement | null>(null);
const submitError = ref('');
const claimError = ref('');
const submitted = ref(false);
const isSubmittingClaim = ref(false);

const isCharacterEmpty = computed(() => characterName.value.trim().length < 3);

const errors = computed(() => ({
  resonance: submitted.value && !formData.value.resonance,
  currentClass: submitted.value && !formData.value.currentClass,
}));

const isFormValid = computed(() =>
  !!formData.value.resonance && !!formData.value.currentClass
);

function scrollLeft() {
  sliderContainer.value?.scrollBy({ left: -200, behavior: 'smooth' });
}
function scrollRight() {
  sliderContainer.value?.scrollBy({ left: 200, behavior: 'smooth' });
}

function handleClassSelection(classValue: string) {
  formData.value.currentClass = classValue;
}

const searchCharacter = async () => {
  if (isCharacterEmpty.value) { characters.value = []; return; }
  isLoading.value = true;
  const response = await getCharacterByName(characterName.value);
  characters.value = response.found ? response.characters.filter((c: any) => c.status === 'unclaimed') : [];
  isLoading.value = false;
};

const handleNameInput = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    !isCharacterEmpty.value && searchCharacter();
  }, 1000);
};

const selectCharacterToClaim = (character: any) => {
  selectedCharacter.value = character;
  step.value = 2;
};

const goToCreateNewCharacter = () => {
  formData.value.name = characterName.value;
  submitted.value = false;
  submitError.value = '';
  step.value = 3;
};

async function claimCharacter() {
  claimError.value = '';
  isSubmittingClaim.value = true;
  try {
    await store.handleCreateCharacterClaim(selectedCharacter.value._id);
    step.value = 4;
  } catch (e: any) {
    claimError.value = e?.response?.data?.message ?? 'Error al enviar la solicitud. Intenta de nuevo.';
  } finally {
    isSubmittingClaim.value = false;
  }
}

async function handleSubmit() {
  submitted.value = true;
  if (!isFormValid.value) return;
  submitError.value = '';
  try {
    await store.handleCreateCharacterCreationRequest({
      name: formData.value.name,
      currentClass: formData.value.currentClass,
      resonance: formData.value.resonance ?? undefined,
    });
    step.value = 4;
  } catch (e: any) {
    submitError.value = e?.response?.data?.message ?? 'Ocurrió un error al enviar la solicitud. Intenta de nuevo.';
  }
}

function backToStep1() {
  submitted.value = false;
  submitError.value = '';
  step.value = 1;
}
</script>

<template>
  <div class="link-form">

    <!-- Step 1: Buscar -->
    <div v-if="step === 1" class="link-step">
      <h4 class="step-title">Buscar personaje</h4>
      <LabeledInput label="Nombre del personaje" id="charName" v-model="characterName" @input="handleNameInput" />
      <p v-if="isLoading" class="searching">Buscando...</p>
      <ul v-if="characters.length" class="char-results">
        <li v-for="char in characters" :key="char.id" @click="selectCharacterToClaim(char)">
          <CharacterCard :character="char" />
        </li>
      </ul>
      <div class="step-actions">
        <button class="action-btn primary" :disabled="isCharacterEmpty" @click="goToCreateNewCharacter">
          <i class="fas fa-plus"></i> Crear nuevo personaje
        </button>
        <button class="action-btn ghost" @click="emit('cancel')">Cancelar</button>
      </div>
    </div>

    <!-- Step 2: Confirmar reclamo -->
    <div v-if="step === 2" class="link-step">
      <h4 class="step-title">Confirmar personaje</h4>
      <CharacterCard :character="selectedCharacter" />
      <p v-if="claimError" class="submit-error">{{ claimError }}</p>
      <div class="step-actions">
        <button type="button" class="action-btn primary" :disabled="isSubmittingClaim" @click="claimCharacter">
          <i class="fas fa-link"></i> {{ isSubmittingClaim ? 'Enviando...' : 'Reclamar' }}
        </button>
        <button type="button" class="action-btn ghost" :disabled="isSubmittingClaim" @click="backToStep1">Volver</button>
      </div>
    </div>

    <!-- Step 4: Éxito -->
    <div v-if="step === 4" class="link-step link-success">
      <i class="fas fa-check-circle"></i>
      <p>Solicitud enviada. Un administrador revisará y te notificará.</p>
      <button type="button" class="action-btn primary" @click="emit('done')">Cerrar</button>
    </div>

    <!-- Step 3: Solicitud de creación -->
    <form v-if="step === 3" class="link-step" @submit.prevent="handleSubmit">
      <h4 class="step-title">Datos del personaje</h4>

      <LabeledInput label="Nombre" id="name" v-model="formData.name" disabled />

      <div class="field-group">
        <LabeledInput label="Resonancia *" id="resonance" v-model.number="formData.resonance" type="number"
          :class="{ 'input-error': errors.resonance }" />
        <p v-if="errors.resonance" class="field-error">La resonancia es obligatoria.</p>
      </div>

      <div class="field-group">
        <label class="field-label">Clase <span class="required-mark">*</span></label>
        <div class="class-selector" :class="{ 'input-error': errors.currentClass }">
          <button type="button" class="slider-arrow" @click="scrollLeft">&#8249;</button>
          <div class="class-scroll" ref="sliderContainer">
            <button type="button" v-for="cls in classes" :key="cls.value"
              :class="{ 'selected': formData.currentClass === cls.value }" @click="handleClassSelection(cls.value)">
              <img :src="cls.image" :alt="cls.name" width="46" height="46" />
              <small>{{ cls.name }}</small>
            </button>
          </div>
          <button type="button" class="slider-arrow" @click="scrollRight">&#8250;</button>
        </div>
        <p v-if="errors.currentClass" class="field-error">Debes seleccionar una clase.</p>
      </div>

      <p v-if="submitError" class="submit-error">{{ submitError }}</p>

      <div class="step-actions">
        <button type="submit" class="action-btn primary">
          <i class="fas fa-paper-plane"></i> Enviar solicitud
        </button>
        <button type="button" class="action-btn ghost" @click="backToStep1">Volver</button>
      </div>
    </form>

  </div>
</template>

<style scoped lang="scss">
$gold: rgb(227, 210, 168);
$gold-mid: rgba(227, 210, 168, .5);
$gold-dim: rgba(227, 210, 168, .15);

.link-form {
  width: 100%;
}

.link-step {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-inline: 1rem;
}

.step-title {
  font-size: .65rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .4);
  margin: 0;
}

.searching {
  font-size: .85rem;
  color: rgba(255, 255, 255, .5);
  margin: 0;
}

.char-results {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: .5rem;
  max-height: 200px;
  overflow-y: auto;

  li {
    cursor: pointer;

    &:hover {
      opacity: .85;
    }
  }
}

.step-actions {
  display: flex;
  gap: .75rem;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .55rem 1.2rem;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-size: .8rem;
  letter-spacing: .05em;
  cursor: pointer;
  transition: background .2s, border-color .2s;

  &.primary {
    background: transparent;
    border: 1px solid $gold-mid;
    color: $gold;

    &:hover {
      background: rgba(227, 210, 168, .08);
      border-color: $gold;
    }

    &:disabled {
      opacity: .35;
      cursor: not-allowed;
    }
  }

  &.ghost {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, .15);
    color: rgba(255, 255, 255, .5);

    &:hover {
      border-color: rgba(255, 255, 255, .35);
      color: rgba(255, 255, 255, .8);
    }
  }
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: .3rem;
}

.field-label {
  font-size: .78rem;
  font-weight: 700;
  letter-spacing: .04em;
}

.required-mark {
  color: #e57373;
}

.class-selector {
  display: flex;
  align-items: center;
  gap: .4rem;
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: .3rem;
  padding: .25rem;

  &.input-error {
    box-shadow: 0 0 0 1px #e57373;
  }
}

.slider-arrow {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, .6);
  font-size: 1.4rem;
  padding: 0 .25rem;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    color: $gold;
  }
}

.class-scroll {
  display: flex;
  gap: .4rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  flex: 1;

  button {
    flex-shrink: 0;
    scroll-snap-align: start;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    padding: .4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .3rem;
    width: 72px;
    font-size: .65rem;
    color: rgba(255, 255, 255, .7);
    cursor: pointer;
    transition: border-color .2s, background .2s;

    &:hover {
      border-color: rgba(227, 210, 168, .4);
    }

    &.selected {
      border-color: $gold-mid;
      background: rgba(227, 210, 168, .08);
      box-shadow: 0 0 6px rgba(227, 210, 168, .2);
    }
  }
}

.field-error {
  margin: 0;
  font-size: .75rem;
  color: #e57373;
}

.link-success {
  align-items: center;
  text-align: center;

  i {
    font-size: 2.5rem;
    color: #81c784;
  }

  p {
    margin: 0;
    font-size: .88rem;
    color: rgba(255, 255, 255, .6);
  }
}

.submit-error {
  margin: 0;
  font-size: .82rem;
  color: #e57373;
  padding: .5rem .75rem;
  background: rgba(229, 115, 115, .08);
  border: 1px solid rgba(229, 115, 115, .3);
  border-radius: 6px;
}
</style>
