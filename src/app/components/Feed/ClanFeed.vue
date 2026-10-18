<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from '../../../middlewares/store';
import { getClanPosts, deleteClanPost, updateClanPost, respondToPublicShadowWar, respondToPublicTowerWar } from '../../../middlewares/services';
import { vigilApi } from '../../../middlewares/services/shadowWarService';
import FeedPostItem from './FeedPostItem.vue';

const store = useStore();
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

// ── call to arms ─────────────────────────────────────────────────
const respondingId = ref<string | null>(null);

function isConfirmed(post: any): boolean {
  const charId = store.currentCharacter;
  if (!charId) return false;
  if (post.source === 'shadow_war') {
    const sw = store.currentUser.shadowWarData;
    if (sw && String(sw._id) === String(post.referenceId))
      return (sw.confirmed ?? []).some((c: any) => String(c?._id ?? c) === charId);
  }
  if (post.source === 'vigil_of_blades') {
    const v = store.currentUser.vigilData;
    if (v && String(v._id) === String(post.referenceId))
      return (v.confirmed ?? []).some((c: any) => String(c?._id ?? c) === charId);
  }
  if (post.source === 'accursed_tower') {
    const tower = (store.currentUser.towerWarList as any[])
      .find((t: any) => String(t._id) === String(post.referenceId));
    if (tower) return (tower.confirmed ?? []).some((c: any) => String(c?._id ?? c) === charId);
  }
  return (post.instanceConfirmed ?? []).includes(charId);
}

async function respondToCall(post: any) {
  if (isConfirmed(post) || respondingId.value) return;
  respondingId.value = post._id;
  try {
    if (post.source === 'shadow_war') {
      await respondToPublicShadowWar(String(post.referenceId), store.currentCharacter!, 'confirm');
      store.handleGetNextShadowWar?.();
    } else if (post.source === 'vigil_of_blades') {
      await vigilApi.respondPublic(String(post.referenceId), store.currentCharacter!, 'confirm');
      store.handleGetActiveVigil();
    } else {
      await respondToPublicTowerWar(String(post.referenceId), store.currentCharacter!, 'confirm');
      store.handleGetActiveTowerWar?.();
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
      <FeedPostItem
        v-for="post in posts"
        :key="post._id"
        v-model:edit-content="editContent"
        :post="post"
        :is-leader-or-officer="isLeaderOrOfficer"
        :menu-active="activeMenu === post._id"
        :editing="editingId === post._id"
        :saving="saving"
        :confirmed="isConfirmed(post)"
        :responding="respondingId === post._id"
        @open-menu="(e) => openMenu(e, post._id)"
        @cancel-edit="cancelEdit"
        @save-edit="saveEdit(post._id)"
        @respond="respondToCall(post)"
      />
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

<style scoped lang="scss" src="./ClanFeed.scss" />
