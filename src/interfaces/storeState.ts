import type { AccursedTower, ShadowWar, Task, UserData } from ".";

/** Notificación en tiempo real recibida por socket. */
export interface AppNotification {
  id: string;
  type: string;
  targetType: 'user' | 'character';
  targetId: string | null;
  data: any;
  read: boolean;
}

export interface storeState {
  currentUser: {
    logged: boolean;
    userData: UserData | null;
    task: Task[] | null;
    /** Fecha seleccionada en tareas (YYYY-MM-DD). */
    taskdate: Date | string | null;
    tasktype: string;
    taskloading: boolean;
    shadowWarData: ShadowWar | null;
    shadowWarError: string | null;
    towerWarList: AccursedTower[];
    towerWarError: string | null;
  };
  layout: {
    tab: { value: string; label: string };
  };
  admin: {
    shadowWars: ShadowWar[] | null;
    currentShadowWar: ShadowWar | null;
    /** Entradas del historial (Guerras Sombrías y Torres Malditas mezcladas). */
    history: any[];
    currentAccursedTower: AccursedTower | null;
  };
  currentCharacter: string | null;
  lastUpdatedTower: AccursedTower | null;
  notifications: AppNotification[];
  pendingInboxCount: number;
  pendingRequestsCount: number;
  clanEventModal: { type: 'accepted' | 'removed'; clanName: string } | null;
}
