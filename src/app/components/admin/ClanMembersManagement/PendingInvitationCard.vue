<script setup lang="ts">
import { ref } from 'vue';
import { classes } from '../../../../middlewares/misc/const';
import { cancelClanInvitation } from '../../../../middlewares/services';

const props = defineProps<{ inv: any; clanId: string }>();
const emit = defineEmits(['refresh']);

const cancelling = ref(false);

async function handleCancel() {
  cancelling.value = true;
  try {
    await cancelClanInvitation(props.clanId, props.inv._id);
    emit('refresh');
  } finally {
    cancelling.value = false;
  }
}

function getClassImage(value: string) {
  return classes.find(c => c.value === value)?.image ?? '';
}
function getClassName(value: string) {
  return classes.find(c => c.value === value)?.name ?? value;
}
</script>

<template>
  <div class="list-container">
    <span class="status-container">
      <div class="status-image">
        <img src="../../../../assets/svg/profile-icon.svg" alt="" />
        <span class="status"></span>
      </div>
    </span>
    <span><p>{{ inv.character?.name ?? '—' }}</p></span>
    <span>
      <span :class="['role-badge', inv.role]">
        {{ inv.role === 'officer' ? 'Oficial' : 'Miembro' }}
      </span>
    </span>
    <span>
      <img
        v-if="inv.character?.currentClass && getClassImage(inv.character.currentClass)"
        :src="getClassImage(inv.character.currentClass)"
        :alt="getClassName(inv.character.currentClass)"
        width="30"
      />
      <span v-else class="no-class">—</span>
    </span>
    <span><p>{{ inv.character?.resonance ?? '—' }}</p></span>
    <span>
      <ul class="buttons-container">
        <button :disabled="cancelling" @click="handleCancel" title="Cancelar invitación">
          <i v-if="cancelling" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-ban"></i>
        </button>
      </ul>
    </span>
  </div>
</template>

<style scoped lang="scss">
p { margin: 0; }

img { padding: 1rem; }

span {
  width: 100%;
  gap: 1rem;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}

.list-container {
  width: 100%;
  display: grid;
  padding-top: .5rem;
  padding-bottom: .5rem;
  grid-template-columns: repeat(6, 1fr);
  border-radius: 9px;
  background-color: var(--color-secondary-bg);
  align-items: center;

  & > span:nth-child(2) {
    justify-content: flex-start;
    overflow: hidden;

    p {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      max-width: 100%;
    }
  }

  & > span:last-child {
    position: sticky;
    right: 0;
    background-color: var(--color-primary-bg);
    padding-inline: .3rem;
    z-index: 1;
  }
}

.role-badge {
  font-size: .68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;

  &.officer { background: rgba(100, 140, 220, 0.2); color: #7aa0e0; }
  &.member  { background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, .5); }
}

.no-class { color: rgba(255, 255, 255, .3); }

.buttons-container {
  max-width: 100px;
  display: flex;
  flex-direction: column;
  gap: .5rem;

  button {
    background-color: var(--color-primary-bg);
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    padding-inline: 1rem;
  }
}

.status-image {
  padding: 0;
  position: relative;

  img { padding: 0; }

  .status {
    position: absolute;
    right: 0;
    bottom: 5px;
    width: 10px;
    height: 10px;
    border-radius: 100%;
    background-color: #eaec72;
  }
}
</style>
