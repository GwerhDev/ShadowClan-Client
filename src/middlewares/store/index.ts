import { defineStore } from 'pinia';
import { logout, createTask, getTasks, getUserData, deleteTask, updateTask, createCompletedTask, deleteCompletedTask, getCharacter, getActiveShadowWar, getShadowWars, getShadowWarById, getClanRequests, createClanRequest, getClanRequestsManagement, deleteAccount, getClanInvitations, createCharacterClaim, createCharacterCreationRequest, getActiveAccursedTower, getHistory, getAccursedTowerById, deactivateAccursedTower, closeShadowWarManagement, getAccursedTowerManagement } from '../services';
import type { storeState, AppNotification } from '../../interfaces/storeState';
import type { AccursedTower, CharacterCreationInput, HistoryType, ShadowWar, TaskInput } from '../../interfaces';
import { WEB_URL } from '../misc/const';
import { getStoredCharacter, setStoredCharacter } from '../misc/characterStorage';

// Promesa compartida de la carga inicial de /auth: el guard del router y App.vue
// esperan la misma petición en vez de lanzar dos.
let userDataPromise: Promise<void> | null = null;

export const useStore = defineStore('store', {
  state: (): storeState => ({
    currentUser: {
      logged: false,
      userData: null,
      task: null,
      taskdate: null,
      tasktype: '',
      taskloading: false,
      shadowWarData: null,
      shadowWarError: null,
      towerWarList: [],
      towerWarError: null,
    },

    layout: {
      tab: { value: '', label: '' },
    },

    admin: {
      shadowWars: null,
      currentShadowWar: null,
      history: [],
      currentAccursedTower: null,
    },
    currentCharacter: "",
    lastUpdatedTower: null,
    notifications: [],
    pendingInboxCount: 0,
    pendingRequestsCount: 0,
    clanEventModal: null,
  }),

  getters: {
    userBattleInfo(): { category: string; match: number; group: number }[] {
      const battle = this.currentUser.shadowWarData?.battle as Record<string, any[]> | undefined;
      const charId = this.currentCharacter;
      if (!battle || !charId) return [];
      const result: { category: string; match: number; group: number }[] = [];
      for (const categoryName in battle) {
        const category = battle[categoryName];
        for (let i = 0; i < category.length; i++) {
          const match = category[i];
          const inGroup = (chars: any[]) => (chars ?? []).some((m: any) => m && (m._id === charId || m === charId));
          if (inGroup(match.group1?.character)) result.push({ category: categoryName, match: i + 1, group: 1 });
          if (inGroup(match.group2?.character)) result.push({ category: categoryName, match: i + 1, group: 2 });
        }
      }
      return result;
    },
  },

  actions: {
    async handleLogout() {
      await logout();
      window.location.href = WEB_URL + '/login';
    },

    async handleDeleteAccount() {
      await deleteAccount();
      window.location.href = WEB_URL + '/login';
    },

    setTaskDate(date: Date | string | null) {
      this.currentUser.taskdate = date;
    },

    setTaskType(type: string) {
      this.currentUser.tasktype = type;
    },

    setTaskLoading(loading: boolean) {
      this.currentUser.taskloading = loading;
    },

    setTab(tab: { value: string; label: string }) {
      this.layout.tab = tab;
    },

    setShadowWarData(data: ShadowWar | null) {
      this.currentUser.shadowWarData = data;
    },

    setShadowWarError(error: string | null) {
      this.currentUser.shadowWarError = error;
    },

    setCurrentShadowWarDetails(shadowWar: ShadowWar | null) {
      this.admin.currentShadowWar = shadowWar;
    },

    async handleGetNextShadowWar() {
      try {
        const response = await getActiveShadowWar(this.currentCharacter ?? undefined);
        this.setShadowWarData(response);
      } catch (error: any) {
        this.setShadowWarError(error.message);
      }
    },

    setTowerWarList(list: AccursedTower[]) {
      this.currentUser.towerWarList = list;
    },

    setTowerWarError(error: string | null) {
      this.currentUser.towerWarError = error;
    },

    async handleGetActiveTowerWar() {
      try {
        const response = await getActiveAccursedTower(this.currentCharacter ?? undefined);
        this.setTowerWarList(Array.isArray(response) ? response : response ? [response] : []);
      } catch (error: any) {
        this.setTowerWarError(error.message);
      }
    },

    async handleGetAccursedTowers(towerId?: string) {
      if (!towerId) return;
      try {
        const fresh = await getAccursedTowerManagement(towerId, this.currentCharacter ?? undefined);
        if (fresh) this.lastUpdatedTower = fresh;
      } catch { /* ignore */ }
    },

    ensureUserData(): Promise<void> {
      if (!userDataPromise) userDataPromise = this.handleUserData();
      return userDataPromise;
    },

    async handleUserData() {
      try {
        this.currentUser = { ...this.currentUser, ...await getUserData() };

        const chars  = this.currentUser.userData?.character ?? [];
        const userId = this.currentUser.userData?.id;

        if (chars.length > 0 && userId) {
          const stored    = await getStoredCharacter(userId);
          const stillValid = stored && chars.some((c: any) => c._id === stored);
          const resolvedId = stillValid ? stored : chars[0]._id;
          this.currentCharacter = resolvedId;
          setStoredCharacter(userId, resolvedId).catch(() => {});
        }
      } catch (error: any) {
        if (error?.response?.status === 401 || !error?.response) {
          window.location.href = WEB_URL + '/login';
        } else {
          console.error(error);
        }
      }
    },

    async handleCreateCompletedTask(id: string, formData: TaskInput) {
      await createCompletedTask(id, formData);
    },

    async handleDeleteCompletedTask(id: string, formData: TaskInput) {
      await deleteCompletedTask(id, formData);
    },

    async handleGetTask(date: Date | string | null, type: string) {
      try {
        const response = await getTasks(date, type, this.currentCharacter);
        this.currentUser.task = response;
        return;
      } catch (error) {
        console.error(error);
      }
    },

    async handleCreateTask(formData: TaskInput) {
      try {
        const response = await createTask(formData);
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleUpdateTask(id: string, formData: TaskInput) {
      try {
        const response = await updateTask(id, formData);
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleDeleteTask(id: string) {
      try {
        const response = await deleteTask(id);
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleGetCharacter() {
      try {
        const response = await getCharacter();
        this.currentUser.userData!.character = response;
        return response;
      } catch (error) {
        console.error(error);
      }
    },


    async handleGetShadowWars(page: number = 1, append: boolean = false) {
      // El backend filtra por el clan del personaje activo; sin personaje no hay nada que pedir.
      if (!this.currentCharacter) return false;
      try {
        const newShadowWars = await getShadowWars(page, this.currentCharacter);
        if (append && this.admin.shadowWars) {
          this.admin.shadowWars = [...this.admin.shadowWars, ...newShadowWars];
        } else {
          this.admin.shadowWars = newShadowWars;
        }
        return newShadowWars.length > 0; // Return true if more data was fetched, false otherwise
      } catch {
        return false;
      }
    },

    async handleGetHistory(page: number = 1, type: HistoryType = 'all', append: boolean = false, q?: string) {
      try {
        const res = await getHistory(page, type, this.currentCharacter ?? undefined, q);
        const items: any[] = res.data ?? [];
        if (append) {
          this.admin.history = [...(this.admin.history ?? []), ...items];
        } else {
          this.admin.history = items;
        }
        return items.length > 0;
      } catch {
        this.admin.history = [];
        return false;
      }
    },

    async handleDeleteTowerWar(id: string) {
      await deactivateAccursedTower(id, this.currentCharacter ?? undefined);
      this.admin.history = (this.admin.history ?? []).filter((w: any) => w._id !== id);
      this.currentUser.towerWarList = this.currentUser.towerWarList.filter(w => w._id !== id);
      if (this.admin.currentAccursedTower?._id === id) {
        this.admin.currentAccursedTower = null;
      }
    },

    async handleDeleteShadowWarHistory(id: string) {
      await closeShadowWarManagement(id, this.currentCharacter ?? undefined);
      this.admin.history = (this.admin.history ?? []).filter((w: any) => w._id !== id);
      if (this.currentUser.shadowWarData?._id === id) {
        this.currentUser.shadowWarData = null;
      }
    },

    async handleGetAccursedTowerDetails(id: string) {
      try {
        const response = await getAccursedTowerById(id, this.currentCharacter ?? undefined);
        this.admin.currentAccursedTower = response;
        return response;
      } catch (error) {
        console.error('Error fetching accursed tower:', error);
        throw error;
      }
    },

    async handleGetShadowWar(id: string) {
      try {
        const response = await getShadowWarById(id, this.currentCharacter ?? undefined);
        this.admin.currentShadowWar = response;

        return response;
      } catch (error) {
        console.error('Error fetching shadow war:', error);
        throw error;
      }
    },

    setCurrentCharacter(id: string | null) {
      this.currentCharacter = id;
      const userId = this.currentUser.userData?.id;
      if (id && userId) {
        setStoredCharacter(userId, id).catch(() => {});
      }
      // Reset clan-scoped state so it refetches for the new character
      this.currentUser.shadowWarData = null;
      this.currentUser.towerWarList  = [];
      this.pendingRequestsCount      = 0; // reset before refetch
      this.handleFetchPendingInbox();
      this.handleFetchPendingRequests(); // recalculate for the new active character
      this.handleGetNextShadowWar();
      this.handleGetActiveTowerWar();
    },

    async handleGetClanRequests() {
      try {
        return await getClanRequests();
      } catch (error) {
        console.error(error);
      }
    },

    async handleCreateClanRequest(characterId: string, clanId: string) {
      try {
        return await createClanRequest(characterId, clanId);
      } catch (error: any) {
        throw error;
      }
    },

    async handleCreateCharacterClaim(characterId: string) {
      return await createCharacterClaim(characterId);
    },

    async handleCreateCharacterCreationRequest(formData: CharacterCreationInput) {
      return await createCharacterCreationRequest(formData);
    },

    addNotification(notification: Omit<AppNotification, 'read' | 'targetId'> & { targetId?: string | null }) {
      if (this.notifications.some(n => n.id === notification.id)) return;
      this.notifications.unshift({ ...notification, targetId: notification.targetId ?? null, read: false });
      const isForActiveChar =
        notification.targetType === 'user' ||
        (notification.targetType === 'character' && notification.targetId === this.currentCharacter);
      if (isForActiveChar) this.pendingInboxCount += 1;
    },

    setPendingInboxCount(n: number) {
      this.pendingInboxCount = n;
    },

    decrementPendingInboxCount() {
      if (this.pendingInboxCount > 0) this.pendingInboxCount -= 1;
    },

    async handleFetchPendingRequests() {
      try {
        const requests = await getClanRequestsManagement(this.currentCharacter ?? undefined) ?? [];
        this.pendingRequestsCount = requests.filter(r => r.status === 'pending').length;
      } catch {
        // silently ignore
      }
    },

    async handleFetchPendingInbox() {
      if (!this.currentCharacter) return;
      try {
        const invs = await getClanInvitations(this.currentCharacter) ?? [];
        this.pendingInboxCount = invs.length;
      } catch {
        // silently ignore — badge stays at 0
      }
    },

    clearNotifications() {
      this.notifications = [];
    },
  }
});

export type AppStore = ReturnType<typeof useStore>;