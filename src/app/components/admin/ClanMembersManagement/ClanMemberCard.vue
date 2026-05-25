<style scoped lang="scss" src="./ClanMemberCard.scss" />
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { classes } from '../../../../middlewares/misc/const';
import { removeClanMember, updateMemberRole, updateClanMember } from '../../../../middlewares/services';

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

const editClass        = ref('');
const editResonance    = ref<number | ''>('');
const editRole         = ref<'officer' | 'member'>('member');
const editMemberStatus = ref('');

const memberStatusOptions = ['activo', 'inactivo', 'retirado'];

onMounted(() => {
  editClass.value        = props.char.currentClass ?? '';
  editResonance.value    = props.char.resonance ?? '';
  editRole.value         = props.role === 'leader' ? 'member' : props.role as 'officer' | 'member';
  editMemberStatus.value = props.char.memberStatus ?? 'activo';
});

function getClassImage(value: string) {
  return classes.find(c => c.value === value)?.image ?? '';
}
function getClassName(value: string) {
  return classes.find(c => c.value === value)?.name ?? value;
}
function styleStatus(s: string) {
  if (s === 'activo')    return { backgroundColor: '#99d499' };
  if (s === 'inactivo')  return { backgroundColor: '#b67f75' };
  if (s === 'retirado')  return { backgroundColor: '#888888' };
  if (s === 'pendiente') return { backgroundColor: '#eaec72' };
  return { backgroundColor: '#888888' };
}
function roleLabel(r: string) {
  if (r === 'leader')  return 'Líder';
  if (r === 'officer') return 'Oficial';
  return 'Miembro';
}

function handleEdit() {
  editionActive.value = true;
}

async function handleUpdate() {
  try {
    await updateClanMember(props.clanId, props.char._id, {
      currentClass: editClass.value || undefined,
      resonance:    editResonance.value !== '' ? Number(editResonance.value) : undefined,
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
  editionActive.value = false;
  deleteActive.value  = false;
  editClass.value        = props.char.currentClass ?? '';
  editResonance.value    = props.char.resonance ?? '';
  editRole.value         = props.role === 'leader' ? 'member' : props.role as 'officer' | 'member';
  editMemberStatus.value = props.char.memberStatus ?? 'activo';
}

function handleDelete() {
  deleteActive.value = true;
}

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
      <img
        v-if="char.currentClass && getClassImage(char.currentClass)"
        :src="getClassImage(char.currentClass)"
        :alt="getClassName(char.currentClass)"
        :title="getClassName(char.currentClass)"
        width="30"
      />
      <span v-else class="no-class">—</span>
    </span>
    <span><p>{{ char.resonance ?? '—' }}</p></span>
    <span>
      <ul class="buttons-container">
        <button v-if="isLeader || isOfficer" @click="handleEdit">
          <img src="../../../../assets/svg/edit-icon.svg" alt="Editar" width="18px" />
        </button>
        <button v-if="role !== 'leader'" @click="handleDelete">
          <img src="../../../../assets/svg/delete-icon.svg" alt="Eliminar" width="22px" />
        </button>
      </ul>
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
      <input type="number" v-model.number="editResonance" />
    </span>
    <span>
      <ul class="buttons-container">
        <button @click="handleUpdate">✔️</button>
        <button @click="handleCancel">❌</button>
      </ul>
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
      <img
        v-if="char.currentClass && getClassImage(char.currentClass)"
        :src="getClassImage(char.currentClass)"
        :alt="getClassName(char.currentClass)"
        width="30"
      />
      <span v-else class="no-class">—</span>
    </span>
    <span><p>{{ char.resonance ?? '—' }}</p></span>
    <span>
      <ul class="buttons-container">
        <button @click="handleConfirmDelete">✔️</button>
        <button @click="handleCancel">❌</button>
      </ul>
    </span>
  </div>
</template>
