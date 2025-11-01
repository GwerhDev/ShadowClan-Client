import { defineStore } from 'pinia';
import { logout, createTask, deleteUser, getTasks, getUserData, getUsers, updateUser, updateUserData, deleteTask, updateTask, chatbotQuery, getAdminNotifications, createCompletedTask, deleteCompletedTask, getChatbotModel, getWarbands, createCharacter, getCharacter, getAdminCharacters, createAdminCharacter, updateAdminCharacter, deleteAdminCharacter, getNextShadowWar, getClans, createClan, updateClan, deleteClan, getShadowWars, updateShadowWar, getShadowWarById } from '../services';
import { storeState } from '../../interfaces/storeState';
import { ShadowWar } from '../../interfaces';
import { claimCharacterAsAdmin, unclaimCharacterAsAdmin } from '../services/admin/characters';

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
  }),

  actions: {
    async handleLogout() {
      await logout();
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
        this.currentCharacter = this.currentUser.userData?.character?.[0] || null;
      } catch (error) {
        console.error(error);
        this.handleLogout();
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
      try {
        const response: any = await createCharacter(formData);
        const newCharacter = response?.character;
        if (newCharacter) {
          if (!Array.isArray(this.currentUser.userData.character)) {
            this.currentUser.userData.character = [];
          }
          this.currentUser.userData.character.push(newCharacter);
          this.setCurrentCharacter(newCharacter._id);
        }
        return response;
      } catch (error) {
        console.error(error);
      }
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
    },
  }
});

export type AppStore = ReturnType<typeof useStore>;