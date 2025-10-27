import { defineStore } from 'pinia';
import { createTask, deleteUser, getTasks, getUserData, getUsers, signupInner, updateUser, updateUserData, deleteTask, updateTask, chatbotQuery, getAdminNotifications, createCompletedTask, deleteCompletedTask, getChatbotModel, getWarbands, createCharacter, getCharacter, getMembers, createMember, updateMember, deleteMember, getNextShadowWar, getClans, createClan, updateClan, deleteClan, getShadowWars, updateShadowWar, getShadowWarById } from '../services';
import { setUserToken } from '../../helpers';
import { API_URL } from '../misc/const';
import { storeState } from '../../interfaces/storeState';
import { ShadowWar } from '../../interfaces/shadowWar';

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
      members: null,
      clans: null,
      shadowWars: null,
      currentShadowWar: null,
    },

    userToken: '',
    currentCharacter: null,
    warbands: null,
  }),

  actions: {
    logout() {
      localStorage.clear();
      this.currentUser = {
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
      } as storeState['currentUser'];
      this.layout = {
        tab: { value: '', label: '' },
      };

      this.admin = {
        users: null,
        tasks: null,
        clantasks: null,
        warbandtasks: null,
        notifications: null,
        members: null,
        clans: null,
        shadowWars: null,
        currentShadowWar: null,
      };

      this.userToken = '';
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

    async handleRegister(data: any) {
      const userToken = await signupInner(data);
      setUserToken(userToken);
      const url = '/account/settings/' + userToken;
      this.userToken = userToken;
      return url;
    },

    handleLogin() {
      const url: string = API_URL + '/login-bnet';
      return url;
    },

    async handleUserData(token: any) {
      try {
        this.currentUser = { ...this.currentUser, ...await getUserData(token) };
        this.currentCharacter = this.currentUser.userData?.character[0]?._id || null;
        this.userToken = token;
        setUserToken(token);
      } catch (error) {
        console.error(error);
      }
    },

    async handleUpdateUserData(formData: any, id: any, token: any) {
      await updateUserData(formData, id, token);
      this.currentUser = await getUserData(token);
      this.userToken = token;
      setUserToken(token);
    },

    async handleGetUsers() {
      this.currentUser.userData?.role === "admin" ? this.admin.users = await getUsers() : null;
    },

    async handleGetMembers() {
      if (this.currentUser.userData?.role === "admin" || this.currentUser.userData?.role === "leader" || this.currentUser.userData?.role === "officer") {
        this.admin.members = await getMembers();
      }
    },

    async handleCreateMember(formData: any) {
      try {
        const response: any = await createMember(formData);
        return response;
      } catch (error) {
        console.error(error);
      }
    },

    async handleUpdateMember(id: string, formData: any) {
      await updateMember(id, formData);
    },

    async handleDeleteMember(id: string) {
      await deleteMember(id);
    },

    async handleUpdateUser(id: string, formData: any) {
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
        this.currentUser.userData?.role === "admin" ? this.admin.notifications = await getAdminNotifications() : null;
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
        this.currentUser.userData.character = response;
        return response;
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
      if (this.currentUser.userData?.role === "admin" || this.currentUser.userData?.role === "leader" || this.currentUser.userData?.role === "officer") {
        this.admin.clans = await getClans();
      }
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

    async handleUpdateClan(id: string, formData: any) {
      const response = await updateClan(id, formData);
      this.admin.clans = response;
      return response;
    },

    async handleDeleteClan(id: string) {
      const response = await deleteClan(id);
      this.admin.clans = response;
      return response;
    },

    async handleGetShadowWars(page: number = 1, append: boolean = false) {
      if (this.currentUser.userData?.role === "admin" || this.currentUser.userData?.role === "leader" || this.currentUser.userData?.role === "officer") {
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

    setCurrentCharacter(character: string | null) {
      this.currentCharacter = character;
    },
  }
});

export type AppStore = ReturnType<typeof useStore>;