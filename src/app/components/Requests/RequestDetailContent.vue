<script setup lang="ts">
import { classes } from '../../../middlewares/misc/const';
import type { InboxItem } from '../../../interfaces';

/** Panel de detalle de una misiva (invitación, solicitud revisada o asignación). */
defineProps<{
  selected: InboxItem | null;
  processingId: string | null;
  actionError: string;
}>();

const emit = defineEmits<{
  (e: 'review', invitationId: string, action: 'accept' | 'reject'): void;
  (e: 'confirm-war', item: InboxItem): void;
  (e: 'confirm-tower', item: InboxItem): void;
  (e: 'dismiss', notifId: string): void;
}>();

function getClassName(value: string) {
  return classes.find(c => c.value === value)?.name ?? value;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}
</script>

<template>
  <div v-if="!selected" class="req-detail-empty">
    <i class="fas fa-scroll"></i>
    <p>Selecciona una misiva para ver el detalle.</p>
  </div>

  <template v-else-if="selected.type === 'clan-invitation'">
    <div class="req-detail-content">
      <div class="req-detail-header">
        <div class="req-detail-type invitation">
          <i class="fas fa-envelope"></i>
          <span>Invitación de clan</span>
        </div>
        <span class="req-detail-date">{{ formatDate(selected.raw.createdAt) }}</span>
      </div>

      <div class="req-detail-clan">
        <i class="fas fa-shield-halved req-clan-icon"></i>
        <div>
          <h2 class="req-clan-name">{{ selected.raw.clan?.name ?? '—' }}</h2>
          <p class="req-clan-sub">te invita a unirte al clan</p>
        </div>
      </div>

      <div class="req-detail-grid">
        <div class="req-detail-item">
          <span class="req-detail-label">Personaje</span>
          <span class="req-detail-value">{{ selected.raw.character?.name ?? '—' }}</span>
        </div>
        <div class="req-detail-item">
          <span class="req-detail-label">Rol ofrecido</span>
          <span class="req-detail-value req-role" :class="selected.raw.role">
            {{ selected.raw.role === 'officer' ? 'Oficial' : 'Miembro' }}
          </span>
        </div>
        <div v-if="selected.raw.proposedClass" class="req-detail-item">
          <span class="req-detail-label">Clase propuesta</span>
          <span class="req-detail-value">{{ getClassName(selected.raw.proposedClass) }}</span>
        </div>
        <div v-if="selected.raw.proposedResonance" class="req-detail-item">
          <span class="req-detail-label">Resonancia propuesta</span>
          <span class="req-detail-value">{{ selected.raw.proposedResonance }}</span>
        </div>
      </div>

      <p v-if="actionError" class="req-error">{{ actionError }}</p>

      <div class="req-detail-actions">
        <button class="req-btn accept" :disabled="processingId === selected.raw._id" @click="emit('review', selected.raw._id, 'accept')">
          <i class="fas fa-check"></i> Aceptar invitación
        </button>
        <button class="req-btn reject" :disabled="processingId === selected.raw._id" @click="emit('review', selected.raw._id, 'reject')">
          <i class="fas fa-times"></i> Rechazar
        </button>
      </div>
    </div>
  </template>

  <template v-else-if="selected.type === 'clan-request-reviewed'">
    <div class="req-detail-content">
      <div class="req-detail-header">
        <div class="req-detail-type" :class="selected.raw.action === 'accept' ? 'accepted' : 'rejected'">
          <i :class="selected.raw.action === 'accept' ? 'fas fa-check' : 'fas fa-times'"></i>
          <span>{{ selected.raw.action === 'accept' ? 'Solicitud aceptada' : 'Solicitud rechazada' }}</span>
        </div>
        <span class="req-detail-date">{{ formatDate(selected.raw.createdAt) }}</span>
      </div>

      <div class="req-detail-clan">
        <i class="fas fa-shield-halved req-clan-icon"></i>
        <div>
          <h2 class="req-clan-name">{{ selected.raw.clan?.name ?? '—' }}</h2>
          <p class="req-clan-sub">
            {{ selected.raw.action === 'accept'
              ? 'ha aceptado tu solicitud de ingreso'
              : 'ha rechazado tu solicitud de ingreso' }}
          </p>
        </div>
      </div>

      <div class="req-detail-actions">
        <button class="req-btn ghost" @click="emit('dismiss', selected.raw._notifId)">
          <i class="fas fa-check"></i> Entendido
        </button>
      </div>
    </div>
  </template>

  <template v-else-if="selected.type === 'shadowwar-assignment' || selected.type === 'vigil-assignment'">
    <div class="req-detail-content">
      <div class="req-detail-header">
        <div class="req-detail-type request">
          <i :class="selected.type === 'vigil-assignment' ? 'fas fa-shield-halved' : 'fas fa-sword'"></i>
          <span>Asignación — {{ selected.type === 'vigil-assignment' ? 'Vigilia de Espadas' : 'Guerra Sombría' }}</span>
        </div>
      </div>

      <div class="req-detail-clan">
        <i class="fas fa-khanda req-clan-icon"></i>
        <div>
          <h2 class="req-clan-name">{{ selected.raw.characterName ?? '—' }}</h2>
          <p class="req-clan-sub">ha sido asignado a la próxima {{ selected.type === 'vigil-assignment' ? 'Vigilia de Espadas' : 'Guerra Sombría' }}</p>
        </div>
      </div>

      <p v-if="actionError" class="req-error">{{ actionError }}</p>

      <div class="req-detail-actions">
        <button class="req-btn accept"
          :disabled="processingId === selected.raw._notifId"
          @click="emit('confirm-war', selected)">
          <i class="fas fa-check"></i>
          {{ processingId === selected.raw._notifId ? 'Confirmando...' : 'Confirmar participación' }}
        </button>
        <button class="req-btn ghost" @click="emit('dismiss', selected.raw._notifId)">
          Descartar
        </button>
      </div>
    </div>
  </template>

  <template v-else-if="selected.type === 'tower-assignment'">
    <div class="req-detail-content">
      <div class="req-detail-header">
        <div class="req-detail-type request">
          <i class="fas fa-chess-rook"></i>
          <span>Asignación — Torre Maldita</span>
        </div>
      </div>

      <div class="req-detail-clan">
        <i class="fas fa-chess-rook req-clan-icon"></i>
        <div>
          <h2 class="req-clan-name">{{ selected.raw.characterName ?? '—' }}</h2>
          <p class="req-clan-sub">ha sido asignado a la próxima Torre Maldita</p>
          <p v-if="selected.raw.towerNumber" class="req-clan-sub">Torre #{{ selected.raw.towerNumber }}</p>
        </div>
      </div>

      <p v-if="actionError" class="req-error">{{ actionError }}</p>

      <div class="req-detail-actions">
        <button class="req-btn accept"
          :disabled="processingId === selected.raw._notifId"
          @click="emit('confirm-tower', selected)">
          <i class="fas fa-check"></i>
          {{ processingId === selected.raw._notifId ? 'Confirmando...' : 'Confirmar participación' }}
        </button>
        <button class="req-btn ghost" @click="emit('dismiss', selected.raw._notifId)">
          Descartar
        </button>
      </div>
    </div>
  </template>

  <template v-else-if="selected.type === 'character-request-reviewed'">
    <div class="req-detail-content">
      <div class="req-detail-header">
        <div class="req-detail-type" :class="selected.raw.action === 'accept' ? 'accepted' : 'rejected'">
          <i :class="selected.raw.action === 'accept' ? 'fas fa-user-check' : 'fas fa-user-times'"></i>
          <span>
            {{ selected.raw.action === 'accept'
              ? (selected.raw.type === 'claim' ? 'Reclamación aprobada' : 'Creación aprobada')
              : (selected.raw.type === 'claim' ? 'Reclamación rechazada' : 'Creación rechazada') }}
          </span>
        </div>
        <span class="req-detail-date">{{ formatDate(selected.raw.createdAt) }}</span>
      </div>

      <div class="req-detail-clan">
        <i class="fas fa-khanda req-clan-icon"></i>
        <div>
          <h2 class="req-clan-name">{{ selected.raw.character?.name ?? '—' }}</h2>
          <p class="req-clan-sub">
            {{ selected.raw.action === 'accept'
              ? 'tu personaje ha sido vinculado a tu cuenta'
              : 'tu solicitud de personaje fue rechazada' }}
          </p>
        </div>
      </div>

      <div class="req-detail-actions">
        <button class="req-btn ghost" @click="emit('dismiss', selected.raw._notifId)">
          <i class="fas fa-check"></i> Entendido
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped lang="scss" src="./RequestDetailContent.scss" />
