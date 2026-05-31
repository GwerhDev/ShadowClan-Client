<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { createClanClaimRequest, getMyClanClaimRequests } from '../../../middlewares/services';

const props = defineProps<{
  characterId: string;
  clanId: string;
  clanName: string;
}>();

const claimRole        = ref<'leader' | 'officer'>('leader');
const claimSubmitting  = ref(false);
const claimStatus      = ref<'idle' | 'success' | 'conflict' | 'error'>('idle');
const pendingClaimReqs = ref<any[]>([]);

onMounted(async () => {
  try {
    const all = await getMyClanClaimRequests();
    pendingClaimReqs.value = (all as any[]).filter((r: any) => r.status === 'pending');
  } catch { pendingClaimReqs.value = []; }
});

async function submitClaimRequest() {
  claimSubmitting.value = true;
  claimStatus.value = 'idle';
  try {
    await createClanClaimRequest({
      characterId:   props.characterId,
      clanId:        props.clanId,
      requestedRole: claimRole.value,
    });
    claimStatus.value = 'success';
    const all = await getMyClanClaimRequests();
    pendingClaimReqs.value = (all as any[]).filter((r: any) => r.status === 'pending');
  } catch (e: any) {
    claimStatus.value = e?.response?.status === 409 ? 'conflict' : 'error';
  } finally {
    claimSubmitting.value = false;
  }
}
</script>

<template>
  <div class="unclaimed-notice">
    <i class="fas fa-shield-halved unclaimed-icon"></i>
    <h2>Clan sin reclamar</h2>
    <p>Tu clan <strong>{{ clanName }}</strong> aún no tiene un Líder u Oficial asignado. Puedes solicitar reclamarlo.</p>

    <div v-if="pendingClaimReqs.length" class="unclaimed-pending">
      <i class="fas fa-clock"></i>
      <span>Solicitud pendiente como <strong>{{ pendingClaimReqs[0].requestedRole === 'leader' ? 'Líder' : 'Oficial' }}</strong>. Espera la revisión de los administradores.</span>
    </div>

    <template v-else>
      <div class="unclaimed-form">
        <div class="unclaimed-role-group">
          <label class="unclaimed-label">Solicitar como</label>
          <div class="unclaimed-role-btns">
            <button :class="['role-opt', { active: claimRole === 'leader' }]" @click="claimRole = 'leader'">
              <i class="fas fa-crown"></i> Líder
            </button>
            <button :class="['role-opt', { active: claimRole === 'officer' }]" @click="claimRole = 'officer'">
              <i class="fas fa-shield-halved"></i> Oficial
            </button>
          </div>
        </div>
        <button class="unclaimed-submit" :disabled="claimSubmitting" @click="submitClaimRequest">
          <i class="fas fa-paper-plane"></i>
          {{ claimSubmitting ? 'Enviando...' : 'Enviar solicitud' }}
        </button>
        <p v-if="claimStatus === 'success'"  class="unclaimed-feedback success">Solicitud enviada. Los administradores la revisarán pronto.</p>
        <p v-if="claimStatus === 'conflict'" class="unclaimed-feedback warning">Ya tienes una solicitud pendiente para este clan.</p>
        <p v-if="claimStatus === 'error'"    class="unclaimed-feedback error">Error al enviar la solicitud.</p>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
$gold: rgb(227, 210, 168);
$gold-dim: rgba(227, 210, 168, .12);

.unclaimed-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2.5rem 1.5rem;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;

  h2 { margin: 0; font-size: 1.4rem; }
  p  { margin: 0; color: rgba(255,255,255,.55); font-size: .9rem; line-height: 1.65; }
  strong { color: $gold; }
}

.unclaimed-icon {
  font-size: 2.5rem;
  color: rgba(227, 210, 168, .5);
  filter: drop-shadow(0 0 12px rgba(227,210,168,.2));
}

.unclaimed-pending {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .9rem 1.25rem;
  background: $gold-dim;
  border: 1px solid rgba(227,210,168,.2);
  border-radius: 8px;
  font-size: .85rem;
  color: rgba(255,255,255,.6);
  text-align: left;
  i { color: $gold; flex-shrink: 0; }
  strong { color: $gold; }
}

.unclaimed-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.unclaimed-label {
  font-size: .65rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(255,255,255,.35);
}

.unclaimed-role-group {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.unclaimed-role-btns {
  display: flex;
  gap: .5rem;
}

.role-opt {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  padding: .55rem 1rem;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,.12);
  background: transparent;
  color: rgba(255,255,255,.5);
  font-size: .82rem;
  cursor: pointer;
  transition: all .15s;

  &:hover { border-color: rgba(255,255,255,.25); color: rgba(255,255,255,.8); }
  &.active { background: $gold-dim; border-color: rgba(227,210,168,.35); color: $gold; }
}

.unclaimed-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .55rem 1.2rem;
  border-radius: 6px;
  border: 1px solid rgba(227,210,168,.4);
  background: transparent;
  color: $gold;
  font-family: 'Cinzel', serif;
  font-size: .8rem;
  cursor: pointer;
  transition: background .2s;
  &:hover:not(:disabled) { background: $gold-dim; }
  &:disabled { opacity: .4; cursor: not-allowed; }
}

.unclaimed-feedback {
  margin: 0;
  font-size: .82rem;
  &.success { color: #81c784; }
  &.warning  { color: $gold; }
  &.error    { color: #e57373; }
}
</style>
