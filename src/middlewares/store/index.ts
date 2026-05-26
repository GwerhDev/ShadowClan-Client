import { defineStore } from 'pinia';
import { logout, createTask, deleteUser, getTasks, getUserData, getUsers, updateUser, updateUserData, deleteTask, updateTask, chatbotQuery, getAdminNotifications, createCompletedTask, deleteCompletedTask, getChatbotModel, getWarbands, createCharacter, getCharacter, getAdminCharacters, createAdminCharacter, updateAdminCharacter, deleteAdminCharacter, getNextShadowWar, getClans, createClan, updateClan, deleteClan, getShadowWars, updateShadowWar, getShadowWarById, getClanRequests, createClanRequest, getClanRequestsManagement, reviewClanRequest, deleteAccount, getClanInvitations } from '../services';
import { storeState } from '../../interfaces/storeState';
import { ShadowWar } from '../../interfaces';
import { claimCharacterAsAdmin, unclaimCharacterAsAdmin } from '../services/admin/characters';
import { WEB_URL } from '../misc/const';
import { getStoredCharacter, setStoredCharacter } from '../misc/characterStorage';

export const useStore = defineStore('store', {
  state: (): storeState => ({
    currentUser: {
      logged: false,
      userData: null,
      task: null,
      taskdate: null,
      tasktype: '',
      taskloading: false,
      guidetype: 'chatbot',
      chatbotmodel: '',
      shadowWarData: null,
      shadowWarError: null,
      userBattleInfo: [],
    },

    layout: {
      tab: { value: '', label: '' },
    },

    admin: {
      users: null,
      tasks: null,
      clantasks: null,
      warbandtasks: null,
      notifications: null,
      characters: null,
      clans: null,
      shadowWars: null,
      currentShadowWar: null,
    },
    currentCharacter: "",
    warbands: null,
    notifications: [],
    pendingInboxCount: 0,
    pendingRequestsCount: 0,
  }),

  actions: {
    async handleLogout() {
      await logout();
      window.location.href = WEB_URL + '/login';
    },

    async handleDeleteAccount() {
      await deleteAccount();
      window.location.href = WEB_URL + '/login';
    },

    setTaskDate(date: any) {
      this.currentUser.taskdate = date;
    },

    setTaskType(type: any) {
      this.currentUser.tasktype = type;
    },

    setTaskLoading(loading: boolean) {
      this.currentUser.taskloading = loading;
    },

    setGuideType(type: string) {
      this.currentUser.guidetype = type;
    },

    setTab(tab: { value: string; label: string }) {
      this.layout.tab = tab;
    },

    setShadowWarData(data: any) {
      this.currentUser.shadowWarData = data;
    },

    setShadowWarError(error: string | null) {
      this.currentUser.shadowWarError = error;
    },

    setCurrentShadowWarDetails(shadowWar: ShadowWar | null) {
      this.admin.currentShadowWar = shadowWar;
    },

    setUserBattleInfo(battleInfo: { category: string; match: number; group: number }[]) {
      this.currentUser.userBattleInfo = battleInfo;
    },

    clearUserBattleInfo() {
      this.currentUser.userBattleInfo = [];
    },

    async handleGetNextShadowWar() {
      try {
        const response = await getNextShadowWar();
        this.setShadowWarData(response);
      } catch (error: any) {
        this.setShadowWarError(error.message);
      }
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

    async handleUpdateUserData(formData: any, id: string) {
      await updateUserData(formData, id);
      this.currentUser = await getUserData();
    },

    async handleGetUsers() {
      if (this.currentUser.userData?.role === "admin" || this.currentUser.userData?.role === "super_admin") {
        this.admin.users = await getUsers();
      }
    },

    async handleGetAdminCharacters() {
      if (this.currentUser.userData?.role === "admin" || this.currentUser.userData?.role === "super_admin") {
        this.admin.characters = await getAdminCharacters();
      }
    },

    async handleCreateAdminCharacter(formData: any) {
      try {
        const response: any = await createAdminCharacter(formData);
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleUpdateAdminCharacter(formData: any) {
      try {
        const response = await updateAdminCharacter(formData);
        this.admin.characters = response.characters;

      } catch (error) {
        console.error(error);
      }
    },

    async handleDeleteMember(id: string) {
      await deleteAdminCharacter(id);
    },

    async handleUpdateUser(formData: any, id: string) {
      await updateUser(id, formData);
    },

    async handleDeleteUser(id: string) {
      await deleteUser(id);
    },

    async handleCreateCompletedTask(id: string, formData: any) {
      await createCompletedTask(id, formData);
    },

    async handleDeleteCompletedTask(id: string, formData: any) {
      await deleteCompletedTask(id, formData);
    },

    async handleGetTask(date: Date, type: string) {
      try {
        const response: any = await getTasks(date, type, this.currentCharacter);
        this.currentUser.task = response;
        return;
      } catch (error) {
        console.error(error);
      }
    },

    async handleCreateTask(formData: any) {
      try {
        const response: any = await createTask(formData);
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleUpdateTask(id: string, formData: any) {
      try {
        const response: any = await updateTask(id, formData);
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleDeleteTask(id: string) {
      try {
        const response: any = await deleteTask(id);
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleChatbotQuery(formData: any) {
      try {
        const response: any = await chatbotQuery(formData);
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleGetAdminNotifications() {
      try {
        this.currentUser.userData?.role === "admin" || this.currentUser.userData?.role === "super_admin" ? this.admin.notifications = await getAdminNotifications() : null;
        return;
      } catch (error) {
        console.error(error);
      }
    },

    async handleGetChatbotModel() {
      try {
        const response: string = await getChatbotModel();
        this.currentUser.chatbotmodel = response;
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleGetCharacter() {
      try {
        const response: any = await getCharacter();
        this.currentUser.userData.character = response;
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleCreateCharacter(formData: any) {
      const response: any = await createCharacter(formData);
      if(response?.error) {
        return response;
      };

      const newCharacter = response.character;
      if (newCharacter) {
        if (!Array.isArray(this.currentUser.userData.character)) {
          this.currentUser.userData.character = [];
        }
        this.currentUser.userData.character.push(newCharacter);
        this.setCurrentCharacter(newCharacter._id);
      }
      return response;
    },

    async handleClaimCharacterAsAdmin(formData: any) {
      try {
        const response = await claimCharacterAsAdmin(formData);
        this.admin.users = response.users;
        this.admin.characters = response.characters;

      } catch (error) {
        console.error(error);
      }
    },

    async handleUnclaimCharacterAsAdmin(formData: any) {
      try {
        const response = await unclaimCharacterAsAdmin(formData);
        this.admin.users = response.users;
        this.admin.characters = response.characters;

      } catch (error) {
        console.error(error);
      }
    },

    async handleGetWarbands() {
      try {
        const response: any = await getWarbands();
        this.warbands = response;
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleGetClans() {
      this.admin.clans = await getClans();
    },

    async handleCreateClan(formData: any) {
      try {
        const response: any = await createClan(formData);
        this.admin.clans = response;
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleUpdateClan(formData: any) {
      const response = await updateClan(formData);
      this.admin.clans = response;
      return;
    },

    async handleDeleteClan(id: string) {
      const response = await deleteClan(id);
      this.admin.clans = response;
      return response;
    },

    async handleGetShadowWars(page: number = 1, append: boolean = false) {
      if (this.currentUser.userData?.role === "admin" || this.currentUser.userData?.role === "super_admin" || this.currentUser.userData?.role === "leader" || this.currentUser.userData?.role === "officer") {
        const newShadowWars = await getShadowWars(page);
        if (append && this.admin.shadowWars) {
          this.admin.shadowWars = [...this.admin.shadowWars, ...newShadowWars];
        } else {
          this.admin.shadowWars = newShadowWars;
        }
        return newShadowWars.length > 0; // Return true if more data was fetched, false otherwise
      }
      return false;
    },

    async handleGetShadowWar(id: string) {
      try {
        const response = await getShadowWarById(id);
        this.admin.currentShadowWar = response;

        return response;
      } catch (error) {
        console.error('Error fetching shadow war:', error);
        throw error;
      }
    },

    async handleUpdateShadowWar(id: string, updatedShadowWar: Partial<ShadowWar>) {
      try {
        const response = await updateShadowWar(id, updatedShadowWar);
        this.admin.currentShadowWar = response;

        return response;
      } catch (error) {
        console.error('Error updating shadow war:', error);
        throw error;
      }
    },

    setCurrentCharacter(id: string | null) {
      this.currentCharacter = id;
      const userId = this.currentUser.userData?.id;
      if (id && userId) {
        setStoredCharacter(userId, id).catch(() => {});
      }
      this.handleFetchPendingInbox();
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

    async handleGetClanRequestsManagement() {
      try {
        return await getClanRequestsManagement();
      } catch (error) {
        console.error(error);
        return [];
      }
    },

    async handleReviewClanRequest(id: string, action: 'accept' | 'reject') {
      return await reviewClanRequest(id, action);
    },

    addNotification(notification: { id: string; type: string; targetType: 'user' | 'character'; targetId?: string | null; data: any }) {
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
        const requests = await getClanRequestsManagement() ?? [];
        this.pendingRequestsCount = (requests as any[]).filter((r: any) => r.status === 'pending').length;
      } catch {
        // silently ignore
      }
    },

    async handleFetchPendingInbox() {
      try {
        const invs = await getClanInvitations() ?? [];
        this.pendingInboxCount = invs.filter(
          (inv: any) => String(inv.character?._id) === String(this.currentCharacter)
        ).length;
      } catch {
        // silently ignore — badge stays at 0
      }
    },

    markNotificationsRead() {
      this.notifications.forEach(n => { n.read = true; });
    },

    clearNotifications() {
      this.notifications = [];
    },
  }
});

export type AppStore = ReturnType<typeof useStore>;