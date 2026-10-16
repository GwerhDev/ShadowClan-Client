<script setup lang="ts">
import { classes } from '../../../middlewares/misc/const';
import shadowWarBanner     from '../../../assets/png/shadow-war-banner.png';
import accursedTowerBanner from '../../../assets/png/accursed-tower-banner.png';

/** Publicación del feed del clan (convocatoria automática o publicación normal). */
defineProps<{
  post: any;
  isLeaderOrOfficer: boolean;
  menuActive: boolean;
  editing: boolean;
  saving: boolean;
  confirmed: boolean;
  responding: boolean;
}>();

/** Texto en edición (solo cuando `editing`). */
const editContent = defineModel<string>('editContent', { required: true });

const emit = defineEmits<{
  (e: 'open-menu', event: MouseEvent): void;
  (e: 'cancel-edit'): void;
  (e: 'save-edit'): void;
  (e: 'respond'): void;
}>();

function getClassImage(value: string | undefined) {
  return classes.find(c => c.value === value)?.image ?? '';
}

function formatDate(iso: string) {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60)    return 'Ahora';
  if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });
}
</script>

<template>
  <li class="feed-item">

  <!-- ── auto call-to-arms ── -->
  <template v-if="post.auto">
    <div class="feed-cta-header">
      <div class="feed-cta-icon">
        <i :class="post.source === 'shadow_war' ? 'fas fa-khanda' : 'fas fa-chess-rook'"></i>
      </div>
      <div class="feed-cta-info">
        <span class="feed-cta-title">
          {{ post.source === 'shadow_war' ? 'Guerra Sombría' : 'Torre Maldita' }}
          <span v-if="post.instanceEnemyClan" class="feed-cta-vs">vs {{ post.instanceEnemyClan }}</span>
        </span>
        <span class="feed-cta-meta">
          {{ post.instanceDate ? formatDate(post.instanceDate) : formatDate(post.createdAt) }}
        </span>
      </div>
      <button
        v-if="isLeaderOrOfficer"
        class="feed-menu-btn"
        :class="{ active: menuActive }"
        @click.stop="emit('open-menu', $event)"
        title="Opciones"
      >
        <i class="fas fa-ellipsis-h"></i>
      </button>
    </div>
    <div class="feed-cta-body">
      <p>
        Tu clan ha convocado una instancia de
        <strong>{{ post.source === 'shadow_war' ? 'Guerra Sombría' : 'Torre Maldita' }}</strong>
        <template v-if="post.instanceEnemyClan"> contra <strong>{{ post.instanceEnemyClan }}</strong></template>.
        ¿Acudirás al llamado?
      </p>
    </div>
  </template>

  <!-- ── regular posts + manually published shadow_war/tower ── -->
  <template v-else>
    <div class="feed-header">
      <img
        v-if="post.author?.currentClass"
        :src="getClassImage(post.author.currentClass)"
        :alt="post.author.currentClass"
        class="feed-avatar"
      />
      <div v-else class="feed-avatar feed-avatar--empty"></div>

      <div class="feed-author-info">
        <div class="feed-author-name-row">
          <span class="feed-author-name">{{ post.author?.name ?? '—' }}</span>
          <span v-if="post.authorRole && post.authorRole !== 'member'" :class="['feed-role-badge', `feed-role-badge--${post.authorRole}`]">
            {{ post.authorRole === 'leader' ? 'Líder' : 'Oficial' }}
          </span>
        </div>
        <span class="feed-author-meta">
          {{ formatDate(post.createdAt) }}
          <template v-if="post.author?.resonance"> · {{ post.author.resonance }} res</template>
        </span>
      </div>

      <button
        v-if="isLeaderOrOfficer"
        class="feed-menu-btn"
        :class="{ active: menuActive }"
        @click.stop="emit('open-menu', $event)"
        title="Opciones"
      >
        <i class="fas fa-ellipsis-h"></i>
      </button>
    </div>
  </template>

  <!-- ── body ── -->
  <div v-if="!post.auto" class="feed-body">
    <template v-if="editing">
      <textarea
        class="feed-edit-textarea"
        v-model="editContent"
        maxlength="1000"
        rows="4"
      />
      <div class="feed-edit-actions">
        <button class="btn-cancel-edit" @click="emit('cancel-edit')">Cancelar</button>
        <button
          class="btn-save-edit"
          :disabled="saving"
          @click="emit('save-edit')"
        >
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </template>
    <p v-else-if="post.content" class="feed-content">{{ post.content }}</p>
  </div>

  <!-- ── shadow war banner + actions ── -->
  <div v-if="post.source === 'shadow_war'" class="feed-sw-wrap">
    <img v-if="!post.auto" :src="shadowWarBanner" class="feed-sw-banner" alt="Shadow War" />
    <div class="feed-sw-actions">
      <button
        v-if="post.auto"
        class="feed-sw-cta feed-sw-cta--respond"
        :class="{ 'feed-sw-cta--confirmed': confirmed }"
        :disabled="confirmed || responding"
        @click="emit('respond')"
      >
        <i :class="responding ? 'fas fa-spinner fa-spin' : confirmed ? 'fas fa-check' : 'fas fa-hand-fist'"></i>
        {{ confirmed ? 'Confirmado' : 'Responder al llamado' }}
      </button>
      <button class="feed-sw-cta" @click="$router.push('/shadow-war')">
        <i class="fas fa-khanda"></i>
        Ver nómina
      </button>
    </div>
  </div>

  <!-- ── accursed tower banner + actions ── -->
  <div v-if="post.source === 'accursed_tower'" class="feed-sw-wrap">
    <img v-if="!post.auto" :src="accursedTowerBanner" class="feed-sw-banner" alt="Torre Maldita" />
    <div class="feed-sw-actions">
      <button
        v-if="post.auto"
        class="feed-sw-cta feed-sw-cta--respond"
        :class="{ 'feed-sw-cta--confirmed': confirmed }"
        :disabled="confirmed || responding"
        @click="emit('respond')"
      >
        <i :class="responding ? 'fas fa-spinner fa-spin' : confirmed ? 'fas fa-check' : 'fas fa-hand-fist'"></i>
        {{ confirmed ? 'Confirmado' : 'Responder al llamado' }}
      </button>
      <button class="feed-sw-cta" @click="$router.push(post.referenceId ? `/accursed-tower/${post.referenceId}` : '/accursed-tower')">
        <i class="fas fa-chess-rook"></i>
        Ver nómina
      </button>
    </div>
  </div>
  </li>
</template>

<style scoped lang="scss" src="./FeedPostItem.scss" />
