<style scoped lang="scss" src="./ClanMemberCard.scss" />
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { classes } from '../../../../middlewares/misc/const';
import { removeClanMember, updateMemberRole, updateClanMember } from '../../../../middlewares/services';
import CustomModal from '../../Modals/CustomModal.vue';

const props = defineProps<{
  char: any;
  role: 'leader' | 'officer' | 'member';
  clanId: string;
  isLeader: boolean;
  isOfficer: boolean;
}>();

const emit = defineEmits(['refresh']);

const editionActive = ref(false);
const deleteActive  = ref(false);
const showStats     = ref(false);

const editClass        = ref('');
const editRole         = ref<'officer' | 'member'>('member');
const editMemberStatus = ref('');

const editStats = ref<Record<string, number | ''>>({
  resonance: '', armor: '', armorPenetration: '', power: '', resistance: '',
});

onMounted(() => {
  editClass.value        = props.char.currentClass ?? '';
  editRole.value         = props.role === 'leader' ? 'member' : props.role as 'officer' | 'member';
  editMemberStatus.value = props.char.memberStatus ?? 'activo';
  editStats.value = {
    resonance:        props.char.resonance        ?? '',
    armor:            props.char.armor            ?? '',
    armorPenetration: props.char.armorPenetration ?? '',
    power:            props.char.power            ?? '',
    resistance:       props.char.resistance       ?? '',
  };
});

function score(c: any): number {
  return (c.resonance ?? 0) + (c.armor ?? 0) + (c.armorPenetration ?? 0) + (c.power ?? 0) + (c.resistance ?? 0);
}

const displayScore = computed(() => score(props.char));

function getClassImage(value: string) { return classes.find(c => c.value === value)?.image ?? ''; }
function getClassName(value: string)  { return classes.find(c => c.value === value)?.name ?? value; }

function styleStatus(s: string) {
  if (s === 'activo')    return { backgroundColor: '#99d499' };
  if (s === 'inactivo')  return { backgroundColor: '#b67f75' };
  if (s === 'retirado')  return { backgroundColor: '#888888' };
  if (s === 'pendiente') return { backgroundColor: '#eaec72' };
  return { backgroundColor: '#888888' };
}
function roleLabel(r: string) {
  return r === 'leader' ? 'Líder' : r === 'officer' ? 'Oficial' : 'Miembro';
}

function handleEdit() { editionActive.value = true; }

async function handleUpdate() {
  try {
    const s = editStats.value;
    await updateClanMember(props.clanId, props.char._id, {
      currentClass:     editClass.value || undefined,
      resonance:        s.resonance        !== '' ? Number(s.resonance)        : undefined,
      armor:            s.armor            !== '' ? Number(s.armor)            : undefined,
      armorPenetration: s.armorPenetration !== '' ? Number(s.armorPenetration) : undefined,
      power:            s.power            !== '' ? Number(s.power)            : undefined,
      resistance:       s.resistance       !== '' ? Number(s.resistance)       : undefined,
    });
    if (props.isLeader && props.role !== 'leader' && editRole.value !== props.role) {
      await updateMemberRole(props.clanId, props.char._id, editRole.value);
    }
  } finally {
    editionActive.value = false;
    emit('refresh');
  }
}

function handleCancel() {
  editionActive.value    = false;
  deleteActive.value     = false;
  editClass.value        = props.char.currentClass ?? '';
  editRole.value         = props.role === 'leader' ? 'member' : props.role as 'officer' | 'member';
  editMemberStatus.value = props.char.memberStatus ?? 'activo';
  editStats.value = {
    resonance:        props.char.resonance        ?? '',
    armor:            props.char.armor            ?? '',
    armorPenetration: props.char.armorPenetration ?? '',
    power:            props.char.power            ?? '',
    resistance:       props.char.resistance       ?? '',
  };
}

function handleDelete() { deleteActive.value = true; }

async function handleConfirmDelete() {
  await removeClanMember(props.clanId, props.char._id);
  emit('refresh');
}
</script>

<template>
  <!-- Vista normal -->
  <div class="list-container" v-if="!editionActive && !deleteActive">
    <span class="status-container">
      <div class="status-image">
        <img src="../../../../assets/svg/profile-icon.svg" alt="" />
        <span class="status" :style="styleStatus(char.memberStatus ?? 'activo')"></span>
      </div>
    </span>
    <span><p>{{ char.name }}</p></span>
    <span><span :class="['role-badge', role]">{{ roleLabel(role) }}</span></span>
    <span>
      <img v-if="char.currentClass && getClassImage(char.currentClass)"
        :src="getClassImage(char.currentClass)" :alt="getClassName(char.currentClass)"
        :title="getClassName(char.currentClass)" width="30" />
      <span v-else class="no-class">—</span>
    </span>
    <span>
      <button class="score-btn" @click="showStats = true" :title="'Ver atributos'">
        {{ displayScore > 0 ? displayScore.toLocaleString('es') : '—' }}
      </button>
    </span>
    <span>
      <div class="buttons-container">
        <button class="icon-button" v-if="isLeader || isOfficer" @click="handleEdit" title="Editar"><i class="fas fa-pen"></i></button>
        <button class="icon-button icon-button--danger" v-if="role !== 'leader' && (isLeader || role === 'member')" @click="handleDelete" title="Eliminar"><i class="fas fa-trash"></i></button>
      </div>
    </span>
  </div>

  <!-- Vista edición -->
  <div class="list-container" v-if="editionActive && !deleteActive">
    <span class="status-container">
      <div class="status-image">
        <img src="../../../../assets/svg/profile-icon.svg" alt="" />
        <span class="status" :style="styleStatus(char.memberStatus ?? 'activo')"></span>
      </div>
    </span>
    <span><p>{{ char.name }}</p></span>
    <span>
      <select v-if="isLeader && role !== 'leader'" v-model="editRole">
        <option value="officer">Oficial</option>
        <option value="member">Miembro</option>
      </select>
      <span v-else :class="['role-badge', role]">{{ roleLabel(role) }}</span>
    </span>
    <span>
      <select v-model="editClass">
        <option value="">Sin clase</option>
        <option v-for="cls in classes" :key="cls.value" :value="cls.value">{{ cls.name }}</option>
      </select>
    </span>
    <span>
      <button class="score-btn score-btn--edit" @click="showStats = true" title="Editar atributos">
        <i class="fas fa-chart-bar"></i> Stats
      </button>
    </span>
    <span>
      <div class="buttons-container">
        <button class="icon-button icon-button--confirm" @click="handleUpdate" title="Guardar"><i class="fas fa-check"></i></button>
        <button class="icon-button" @click="handleCancel" title="Cancelar"><i class="fas fa-times"></i></button>
      </div>
    </span>
  </div>

  <!-- Vista confirmar eliminación -->
  <div class="list-container red-bg" v-if="!editionActive && deleteActive">
    <span class="status-container">
      <div class="status-image">
        <img src="../../../../assets/svg/profile-icon.svg" alt="" />
        <span class="status" :style="styleStatus(char.memberStatus ?? 'activo')"></span>
      </div>
    </span>
    <span><p>{{ char.name }}</p></span>
    <span><span :class="['role-badge', role]">{{ roleLabel(role) }}</span></span>
    <span>
      <img v-if="char.currentClass && getClassImage(char.currentClass)"
        :src="getClassImage(char.currentClass)" :alt="getClassName(char.currentClass)" width="30" />
      <span v-else class="no-class">—</span>
    </span>
    <span><p>{{ displayScore > 0 ? displayScore.toLocaleString('es') : '—' }}</p></span>
    <span>
      <div class="buttons-container">
        <button class="icon-button icon-button--confirm" @click="handleConfirmDelete" title="Confirmar eliminación"><i class="fas fa-check"></i></button>
        <button class="icon-button" @click="handleCancel" title="Cancelar"><i class="fas fa-times"></i></button>
      </div>
    </span>
  </div>

  <!-- Modal stats -->
  <CustomModal v-if="showStats" :title="char.name" @close="showStats = false">
    <div class="stats-modal">
      <div class="stats-row" v-for="stat in [
        { label: 'Resonancia',  key: 'resonance'        },
        { label: 'Armadura',    key: 'armor'             },
        { label: 'Penetración', key: 'armorPenetration'  },
        { label: 'Potencia',    key: 'power'             },
        { label: 'Resistencia', key: 'resistance'        },
      ]" :key="stat.key">
        <span class="stats-label">{{ stat.label }}</span>
        <span v-if="!editionActive" class="stats-value">
          {{ (char[stat.key] ?? '—') !== '—' ? Number(char[stat.key]).toLocaleString('es') : '—' }}
        </span>
        <input v-else type="number" class="stats-input"
          v-model.number="editStats[stat.key]"
          placeholder="—" />
      </div>
      <div class="stats-total">
        <span class="stats-label">Puntaje total</span>
        <span class="stats-value stats-value--total">
          {{ editionActive
            ? Object.values(editStats).reduce((s: number, v) => s + (v !== '' ? Number(v) : 0), 0).toLocaleString('es')
            : displayScore > 0 ? displayScore.toLocaleString('es') : '—'
          }}
        </span>
      </div>

      <div v-if="editionActive" class="stats-actions">
        <button class="btn-save-stats" @click="showStats = false">
          <i class="fas fa-check"></i> Listo
        </button>
      </div>
    </div>
  </CustomModal>
</template>

<style scoped lang="scss">
.score-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 5px;
  color: rgba(255, 255, 255, .7);
  font-size: .82rem;
  padding: .15rem .5rem;
  cursor: pointer;
  transition: border-color .15s, color .15s, background .15s;

  &:hover {
    border-color: rgba(227, 210, 168, .4);
    color: rgb(227, 210, 168);
    background: rgba(227, 210, 168, .05);
  }

  &--edit {
    display: flex;
    align-items: center;
    gap: .3rem;
    font-size: .75rem;
    color: rgba(227, 210, 168, .7);
    border-color: rgba(227, 210, 168, .2);
  }
}

.stats-modal {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  min-width: 240px;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .4rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, .06);
}

.stats-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: .5rem;
}

.stats-label {
  font-size: .78rem;
  color: rgba(255, 255, 255, .4);
  text-transform: uppercase;
  letter-spacing: .06em;
}

.stats-value {
  font-size: .9rem;
  color: rgba(255, 255, 255, .8);
  font-weight: 500;

  &--total {
    font-size: 1rem;
    color: rgba(227, 210, 168, .9);
    font-weight: 700;
  }
}

.stats-input {
  width: 80px;
  height: 24px;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(227, 210, 168, .3);
  color: rgba(255, 255, 255, .85);
  font-size: .88rem;
  text-align: right;
  outline: none;
  padding: 0;

  &:focus { border-bottom-color: rgba(227, 210, 168, .7); }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { -webkit-appearance: none; }
  -moz-appearance: textfield;
}

.stats-actions {
  padding-top: .5rem;
}

.btn-save-stats {
  display: flex;
  align-items: center;
  gap: .4rem;
  width: 100%;
  height: 30px;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(227, 210, 168, .3);
  border-radius: 6px;
  color: rgba(227, 210, 168, .8);
  font-size: .82rem;
  cursor: pointer;
  transition: background .15s, border-color .15s;

  &:hover { background: rgba(227, 210, 168, .07); border-color: rgba(227, 210, 168, .55); }
}
</style>
