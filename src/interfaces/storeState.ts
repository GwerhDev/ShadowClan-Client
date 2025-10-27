import { ShadowWar } from "./shadowWar";

export interface storeState {
  currentUser: {
    logged: boolean,
    userData: any,
    task: any,
    taskdate: any,
    tasktype: string,
    taskloading: boolean,
    guidetype: string,
    chatbotmodel: string,
    shadowWarData: ShadowWar | null;
    shadowWarError: string | null;
    userBattleInfo: {
      category: string;
      match: number;
      group: number;
    }[];
  },
  layout: {
    tab: { value: string; label: string; };
  },
  admin: {
    users: any,
    tasks: any,
    clantasks: any,
    warbandtasks: any,
    notifications: any,
    shadowWars: any,
    members: any,
    clans: any,
    currentShadowWar: ShadowWar | null;
  },
  userToken: string,
  currentCharacter: string | null,
  warbands: any,
}