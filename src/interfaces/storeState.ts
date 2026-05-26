import { ShadowWar } from ".";

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
    characters: any,
    clans: any,
    currentShadowWar: ShadowWar | null;
  },
  currentCharacter: string | null,
  warbands: any,
  notifications: { id: string; type: string; targetType: 'user' | 'character'; targetId: string | null; data: any; read: boolean }[],
  pendingInboxCount: number,
  pendingRequestsCount: number,
  clanEventModal: { type: 'accepted' | 'removed'; clanName: string } | null,
}
