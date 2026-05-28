import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';
import { useStore } from '../../middlewares/store';
import ClanManagementPage from '../pages/admin/ClanManagementPage.vue';
import HistoryDetails from '../components/admin/HistoryManagement/HistoryDetails.vue';
import AccursedTowerHistoryDetails from '../components/admin/HistoryManagement/AccursedTowerHistoryDetails.vue';
import ShadowWarManagement from '../components/admin/ShadowWarManagement/ShadowWar.vue';
import HistoryManagement from '../components/admin/HistoryManagement/HistoryManagement.vue';
import AccursedTowerManagement from '../components/admin/AccursedTowerManagement/AccursedTower.vue';
import ClanMembersManagement from '../components/admin/ClanMembersManagement/ClanMembersManagement.vue';

import UserPage from '../pages/UserPage.vue';
import ProfileComponent from '../components/Account/ProfileComponent.vue';
import SettingsComponent from '../components/Account/SettingsComponent.vue';
import RequestsPage from '../pages/RequestsPage.vue';

import ShadowWarPage from '../pages/ShadowWarPage.vue';
import FamedShadowWar from '../components/ShadowWar/FamedShadowWar.vue';
import ProudShadowWar from '../components/ShadowWar/ProudShadowWar.vue';
import ExaltedShadowWar from '../components/ShadowWar/ExaltedShadowWar.vue';
import EminentShadowWar from '../components/ShadowWar/EminentShadowWar.vue';

import AccursedTowerPage from '../pages/AccursedTowerPage.vue';
import AccursedTower from '../components/AccursedTower/AccursedTower.vue';

import TaskPage from '../pages/TaskPage.vue';
import TasksComponent from '../components/Tasks/TasksComponent.vue';
import HomePage from '../pages/HomePage.vue';
import ClanFeed from '../components/Feed/ClanFeed.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/shadow-war',
    name: 'ShadowWar',
    component: ShadowWarPage,
    meta: { title: 'Guerra Sombría' },
    children: [
      {
        path: 'exalted',
        name: 'ShadowWarExalted',
        component: ExaltedShadowWar,
        meta: { title: 'Guerra Sombría' },
      },
      {
        path: 'eminent',
        name: 'ShadowWarEminent',
        component: EminentShadowWar,
        meta: { title: 'Guerra Sombría' },
      },
      {
        path: 'famed',
        name: 'ShadowWarFamed',
        component: FamedShadowWar,
        meta: { title: 'Guerra Sombría' },
      },
      {
        path: 'proud',
        name: 'ShadowWarProud',
        component: ProudShadowWar,
        meta: { title: 'Guerra Sombría' },
      },
    ],
  },
  {
    path: '/accursed-tower',
    name: 'AccursedTower',
    component: AccursedTowerPage,
    meta: { title: 'Torre Maldita' },
    children: [
      {
        path: ':accursedtower_id',
        name: 'Tower',
        component: AccursedTower,
        meta: { title: 'Torre Maldita' },
      },
    ],
  },
  {
    path: '/management',
    name: 'ClanManagement',
    component: ClanManagementPage,
    redirect: '/management/clan',
    children: [
      {
        path: 'clan',
        name: 'ManagementClan',
        component: ClanMembersManagement,
        meta: { title: 'Clan', requiresClanManagement: true },
      },
      {
        path: 'shadow-war',
        name: 'ManagementShadowWar',
        component: ShadowWarManagement,
        meta: { title: 'Guerra Sombría', requiresClanManagement: true },
      },
      {
        path: 'accursed-tower',
        name: 'ManagementAccursedTower',
        component: AccursedTowerManagement,
        meta: { title: 'Torre Maldita', requiresClanManagement: true },
      },
      {
        path: 'history',
        name: 'ManagementHistory',
        component: HistoryManagement,
        meta: { title: 'Historial', requiresClanManagement: true },
        children: [
          {
            path: 'accursed-tower/:tower_id',
            name: 'ManagementHistoryTowerDetails',
            component: AccursedTowerHistoryDetails,
            meta: { title: 'Historial Torre', requiresClanManagement: true },
          },
          {
            path: 'shadow-war/:shadowwar_id',
            name: 'ManagementHistoryDetails',
            component: HistoryDetails,
            meta: { title: 'Historial', requiresClanManagement: true },
          },
        ],
      },
    ],
  },
  {
    path: '/u',
    name: 'UserPage',
    component: UserPage,
    redirect: '/profile',
    meta: { title: 'Usuario' },
    children: [
      {
        path: 'profile',
        name: 'Profile',
        component: ProfileComponent,
        meta: { title: 'Perfil' },
      },
      {
        path: 'account',
        name: 'Account',
        component: SettingsComponent,
        meta: { title: 'Cuenta' },
      },
    ]
  },
  {
    path: '/requests',
    name: 'Requests',
    component: RequestsPage,
    meta: { title: 'Misivas' },
  },
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: { title: 'Inicio' },
    children: [
      {
        path: '',
        name: 'Feed',
        component: ClanFeed,
        meta: { title: 'Feed' },
      },
    ]
  },
  {
    path: '/tasks',
    name: 'TaskPage',
    component: TaskPage,
    redirect: '/tasks/my-tasks',
    children: [
      {
        path: 'my-tasks',
        name: 'MyTasks',
        component: TasksComponent,
        meta: { taskType: 'mytasks', title: 'Mis Tareas' }
      },
      {
        path: 'clan-tasks',
        name: 'ClanTasks',
        component: TasksComponent,
        meta: { taskType: 'clantasks', title: 'Tareas del Clan' }
      }
    ]
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
});

const WALKER_ALLOWED: string[] = ['Home', 'Feed', 'TaskPage', 'MyTasks', 'ClanTasks', 'UserPage', 'Profile', 'Account', 'Requests'];

router.beforeEach((to, _from, next) => {
  const store = useStore();

  if (!store.currentUser.logged) return next();

  const role         = store.currentUser.userData?.role;
  const isSuperAdmin = role === 'super_admin';
  const isAdmin      = role === 'admin' || isSuperAdmin;

  if (to.meta.requiresClanManagement) {
    const chars   = store.currentUser.userData?.character ?? [];
    const active  = (chars as any[]).find((c: any) => c._id === store.currentCharacter) ?? chars[0] ?? null;
    const clan    = active?.clan;
    const charId  = String(active?._id);
    const isLeaderOrOfficer = isAdmin || (clan && (
      String(clan.leader) === charId ||
      (clan.officer ?? []).some((o: any) => String(o) === charId)
    ));
    if (!isLeaderOrOfficer) return next({ name: 'Home' });
  }

  if (!isAdmin) {
    const chars    = store.currentUser.userData?.character ?? [];
    const active   = (chars as any[]).find((c: any) => c._id === store.currentCharacter) ?? chars[0] ?? null;
    const isWalker = !active?.clan;
    if (isWalker && to.name && !WALKER_ALLOWED.includes(to.name as string)) {
      return next({ name: 'Home' });
    }
  }

  next();
});

export default router;
