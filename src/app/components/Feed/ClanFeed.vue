<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from '../../../middlewares/store';
import { getClanPosts, deleteClanPost, updateClanPost, respondToShadowWar, respondToTowerWar } from '../../../middlewares/services';
import { classes } from '../../../middlewares/misc/const';
import shadowWarBanner     from '../../../assets/png/shadow-war-banner.png';
import accursedTowerBanner from '../../../assets/png/accursed-tower-banner.png';

const store: any = useStore();
const posts   = ref<any[]>([]);
const loading = ref(true);

// ── context menu ──────────────────────────────────────────────────
const activeMenu = ref<string | null>(null);
const menuPos    = ref({ top: 0, left: 0 });

function openMenu(event: MouseEvent, postId: string) {
  if (activeMenu.value === postId) { activeMenu.value = null; return; }
  const btn  = event.currentTarget as HTMLElement;
  const rect = btn.getBoundingClientRect();
  menuPos.value = {
    top:  rect.bottom + 6,
    left: rect.right - 148,
  };
  activeMenu.value = postId;
}

function closeMenu() { activeMenu.value = null; }

onMounted(()   => document.addEventListener('click', closeMenu));
onUnmounted(() => document.removeEventListener('click', closeMenu));

// ── edit ──────────────────────────────────────────────────────────
const editingId   = ref<string | null>(null);
const editContent = ref('');
const saving      = ref(false);

function startEdit(post: any) {
  editingId.value   = post._id;
  editContent.value = post.content;
  closeMenu();
}

function cancelEdit() {
  editingId.value   = null;
  editContent.value = '';
}

async function saveEdit(postId: string) {
  saving.value = true;
  try {
    await updateClanPost(postId, editContent.value.trim());
    const idx = posts.value.findIndex(p => p._id === postId);
    if (idx !== -1) posts.value[idx] = { ...posts.value[idx], content: editContent.value.trim() };
    cancelEdit();
  } catch { /* silently ignore */ }
  finally  { saving.value = false; }
}

// ── delete ────────────────────────────────────────────────────────
const deletingId = ref<string | null>(null);

async function removePost(postId: string) {
  closeMenu();
  deletingId.value = postId;
  try {
    await deleteClanPost(postId);
    posts.value = posts.value.filter(p => p._id !== postId);
  } catch { /* silently ignore */ }
  finally  { deletingId.value = null; }
}

// ── permissions ───────────────────────────────────────────────────
const currentCharacter = computed(() => store.currentCharacter);

const isLeaderOrOfficer = computed(() => {
  const role = store.currentUser.userData?.role;
  if (role === 'admin' || role === 'super_admin') return true;
  const chars  = (store.currentUser.userData?.character ?? []) as any[];
  const active = chars.find(c => String(c._id) === store.currentCharacter) ?? null;
  if (!active?.clan) return false;
  const charId = String(active._id);
  const clan   = active.clan;
  return String(clan.leader) === charId ||
    (clan.officer ?? []).some((o: any) => String(o) === charId);
});

// ── helpers ───────────────────────────────────────────────────────
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

// ── call to arms ─────────────────────────────────────────────────
const respondingId = ref<string | null>(null);

function isConfirmed(post: any): boolean {
  return (post.instanceConfirmed ?? []).includes(store.currentCharacter);
}

async function respondToCall(post: any) {
  if (isConfirmed(post) || respondingId.value) return;
  respondingId.value = post._id;
  try {
    if (post.source === 'shadow_war') {
      await respondToShadowWar(String(post.referenceId), store.currentCharacter);
    } else {
      await respondToTowerWar(String(post.referenceId), store.currentCharacter);
    }
    const idx = posts.value.findIndex(p => p._id === post._id);
    if (idx !== -1) {
      posts.value[idx] = {
        ...posts.value[idx],
        instanceConfirmed: [...(posts.value[idx].instanceConfirmed ?? []), store.currentCharacter],
      };
    }
  } catch { /* silently ignore */ }
  finally  { respondingId.value = null; }
}

// ── fetch ─────────────────────────────────────────────────────────
async function fetchPosts(charId: string) {
  loading.value = true;
  try    { posts.value = await getClanPosts(charId) ?? []; }
  catch  { posts.value = []; }
  finally{ loading.value = false; }
}

watch(currentCharacter, charId => { if (charId) fetchPosts(charId); }, { immediate: true });
</script>

<template>
  <div class="clan-feed">

    <div v-if="loading" class="feed-empty">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando feed...</p>
    </div>

    <div v-else-if="!posts.length" class="feed-empty">
      <i class="fas fa-newspaper"></i>
      <p>El clan aún no tiene publicaciones.</p>
    </div>

    <ul v-else class="feed-list">
      <li v-for="post in posts" :key="post._id" class="feed-item">

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
              :class="{ active: activeMenu === post._id }"
              @click.stop="openMenu($event, post._id)"
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
              :class="{ active: activeMenu === post._id }"
              @click.stop="openMenu($event, post._id)"
              title="Opciones"
            >
              <i class="fas fa-ellipsis-h"></i>
            </button>
          </div>
        </template>

        <!-- ── body ── -->
        <div v-if="!post.auto" class="feed-body">
          <template v-if="editingId === post._id">
            <textarea
              class="feed-edit-textarea"
              v-model="editContent"
              maxlength="1000"
              rows="4"
            />
            <div class="feed-edit-actions">
              <button class="btn-cancel-edit" @click="cancelEdit">Cancelar</button>
              <button
                class="btn-save-edit"
                :disabled="saving"
                @click="saveEdit(post._id)"
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
              :class="{ 'feed-sw-cta--confirmed': isConfirmed(post) }"
              :disabled="isConfirmed(post) || respondingId === post._id"
              @click="respondToCall(post)"
            >
              <i :class="respondingId === post._id ? 'fas fa-spinner fa-spin' : isConfirmed(post) ? 'fas fa-check' : 'fas fa-hand-fist'"></i>
              {{ isConfirmed(post) ? 'Confirmado' : 'Responder al llamado' }}
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
              :class="{ 'feed-sw-cta--confirmed': isConfirmed(post) }"
              :disabled="isConfirmed(post) || respondingId === post._id"
              @click="respondToCall(post)"
            >
              <i :class="respondingId === post._id ? 'fas fa-spinner fa-spin' : isConfirmed(post) ? 'fas fa-check' : 'fas fa-hand-fist'"></i>
              {{ isConfirmed(post) ? 'Confirmado' : 'Responder al llamado' }}
            </button>
            <button class="feed-sw-cta" @click="$router.push(post.referenceId ? `/accursed-tower/${post.referenceId}` : '/accursed-tower')">
              <i class="fas fa-chess-rook"></i>
              Ver nómina
            </button>
          </div>
        </div>

      </li>
    </ul>

    <!-- ── context menu via Teleport ── -->
    <Teleport to="body">
      <div
        v-if="activeMenu"
        class="feed-context-menu"
        :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }"
        @click.stop
      >
        <button
          v-if="!posts.find(p => p._id === activeMenu)?.auto"
          class="ctx-item"
          @click="startEdit(posts.find(p => p._id === activeMenu))"
        >
          <i class="fas fa-pen"></i>
          Editar
        </button>
        <div v-if="!posts.find(p => p._id === activeMenu)?.auto" class="ctx-divider"></div>
        <button
          class="ctx-item ctx-danger"
          :disabled="!!deletingId"
          @click="removePost(activeMenu!)"
        >
          <i :class="deletingId === activeMenu ? 'fas fa-spinner fa-spin' : 'fas fa-trash'"></i>
          Eliminar
        </button>
      </div>
    </Teleport>

  </div>
</template>

<style scoped lang="scss">
.clan-feed {
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
  text-align: left;
}

/* ── empty ── */
.feed-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 60vh;
  color: rgba(255, 255, 255, .2);
  font-size: .9rem;

  i { font-size: 3.5rem; }
  p { margin: 0; }
}

/* ── list ── */
.feed-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

/* ── card ── */
.feed-item {
  background: var(--color-secondary-bg);
  border: 1px solid rgba(255, 255, 255, .06);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── call-to-arms body ── */
.feed-cta-body {
  padding: .5rem 1rem .75rem;

  p {
    margin: 0;
    font-size: .88rem;
    color: rgba(255, 255, 255, .7);
    line-height: 1.5;

    strong { color: var(--color-app-white); }
  }
}

/* ── call-to-arms header ── */
.feed-cta-header {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .9rem 1rem .65rem;
}

.feed-cta-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(227, 210, 168, .08);
  border: 1px solid rgba(227, 210, 168, .2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: rgb(227, 210, 168);
  font-size: 1rem;
}

.feed-cta-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: .1rem;
}

.feed-cta-title {
  font-size: .9rem;
  font-weight: 700;
  color: var(--color-app-white);
  display: flex;
  align-items: center;
  gap: .4rem;
  flex-wrap: wrap;
}

.feed-cta-vs {
  font-size: .78rem;
  font-weight: 400;
  color: rgba(255, 255, 255, .5);
}

.feed-cta-meta {
  font-size: .72rem;
  color: rgba(255, 255, 255, .38);
}

/* ── header ── */
.feed-header {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .9rem 1rem .65rem;
}

.feed-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;

  &--empty {
    background: rgba(255, 255, 255, .08);
  }
}

.feed-author-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: .1rem;
}

.feed-author-name-row {
  display: flex;
  align-items: center;
  gap: .4rem;
  flex-wrap: wrap;
}

.feed-author-name {
  font-size: .9rem;
  font-weight: 600;
  color: var(--color-app-white);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feed-role-badge {
  font-size: .62rem;
  font-weight: 600;
  letter-spacing: .04em;
  padding: .1rem .4rem;
  border-radius: 4px;
  line-height: 1.4;
  flex-shrink: 0;
  text-transform: uppercase;

  &--leader {
    background: rgba(227, 210, 168, .12);
    color: rgb(227, 210, 168);
    border: 1px solid rgba(227, 210, 168, .3);
  }

  &--officer {
    background: rgba(105, 169, 228, .12);
    color: rgb(105, 169, 228);
    border: 1px solid rgba(105, 169, 228, .3);
  }
}

.feed-author-meta {
  font-size: .72rem;
  color: rgba(255, 255, 255, .38);
  line-height: 1.2;
}

/* ── three-dots ── */
.feed-menu-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, .45);
  font-size: .88rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background .12s, color .12s;

  &:hover, &.active {
    background: rgba(255, 255, 255, .09);
    color: rgba(255, 255, 255, .9);
  }
}

/* ── body ── */
.feed-body {
  padding: 0 1rem .9rem;
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

.feed-content {
  margin: 0;
  font-size: .92rem;
  color: rgba(255, 255, 255, .85);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── shadow war banner ── */
.feed-sw-wrap {
  display: flex;
  flex-direction: column;
}

.feed-sw-actions {
  display: flex;
  border-top: 1px solid rgba(255, 255, 255, .05);
}

.feed-sw-banner {
  width: 100%;
  display: block;
  object-fit: cover;
  border-top: 1px solid rgba(255, 255, 255, .05);
}

.feed-sw-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  flex: 1;
  padding: .6rem 1rem;
  font-size: .78rem;
  font-weight: 600;
  letter-spacing: .04em;
  font-family: 'Cinzel', serif;
  cursor: pointer;
  border-radius: 0;
  background: rgba(227, 210, 168, .06);
  border: none;
  color: rgb(227, 210, 168);
  transition: background .15s, color .15s;

  i { font-size: .72rem; }

  &:hover:not(:disabled) {
    background: rgba(227, 210, 168, .12);
    color: #fff;
  }

  &:disabled { cursor: default; }

  & + & {
    border-left: 1px solid rgba(255, 255, 255, .05);
  }

  &--respond {
    background: rgba(255, 255, 255, .03);
    color: rgba(255, 255, 255, .6);

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, .07);
      color: rgba(255, 255, 255, .9);
    }
  }

  &--confirmed {
    color: #4ade80;
    background: rgba(34, 197, 94, .06);

    &:hover:not(:disabled) {
      background: rgba(34, 197, 94, .06);
      color: #4ade80;
    }
  }
}

/* ── edit mode ── */
.feed-edit-textarea {
  width: 100%;
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 8px;
  color: var(--color-app-white);
  font-size: .9rem;
  padding: .65rem .9rem;
  resize: none;
  overflow: auto;
  font-family: inherit;
  line-height: 1.6;
  transition: border-color .15s;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, .25);
  }
}

.feed-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: .5rem;
}

.btn-cancel-edit,
.btn-save-edit {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: .35rem .9rem;
  border-radius: 6px;
  font-size: .78rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background .15s, border-color .15s, opacity .15s;

  &:disabled { opacity: .4; cursor: not-allowed; }
}

.btn-cancel-edit {
  background: transparent;
  border-color: rgba(255, 255, 255, .12);
  color: rgba(255, 255, 255, .5);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, .06);
    border-color: rgba(255, 255, 255, .22);
    color: rgba(255, 255, 255, .8);
  }
}

.btn-save-edit {
  background: transparent;
  border-color: rgba(227, 210, 168, .35);
  color: rgb(227, 210, 168);

  &:hover:not(:disabled) {
    background: rgba(227, 210, 168, .08);
    border-color: rgba(227, 210, 168, .6);
  }
}
</style>

<!-- context menu — no scoped, vive en body via Teleport -->
<style lang="scss">
.feed-context-menu {
  position: fixed;
  z-index: 9999;
  width: max-content;
  background: #1e2029;
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .55);
  padding: .3rem;
  display: flex;
  flex-direction: column;

  .ctx-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: .55rem;
    padding: .5rem .75rem;
    border-radius: 5px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, .7);
    font-size: .82rem;
    cursor: pointer;
    width: 100%;
    transition: background .12s, color .12s;

    i { width: 14px; text-align: center; font-size: .78rem; }

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, .07);
      color: rgba(255, 255, 255, .95);
    }

    &:disabled { opacity: .4; cursor: not-allowed; }
  }

  .ctx-danger {
    color: rgba(229, 115, 115, .8);

    &:hover:not(:disabled) {
      background: rgba(229, 115, 115, .08);
      color: rgb(229, 115, 115);
    }
  }

  .ctx-divider {
    height: 1px;
    background: rgba(255, 255, 255, .07);
    margin: .25rem 0;
  }
}
</style>
