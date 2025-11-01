import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';
import DashboardPage from '../pages/admin/DashboardPage.vue';
import UserManagement from '../components/admin/UserManagement/UserManagement.vue';
import ClanManagement from '../components/admin/ClanManagement/ClanManagement.vue';
import HistoryDetails from '../components/admin/HistoryManagement/HistoryDetails.vue';
import ShadowWarManagement from '../components/admin/ShadowWarManagement/ShadowWar.vue';
import HistoryManagement from '../components/admin/HistoryManagement/HistoryManagement.vue';
import CharacterManagement from '../components/admin/CharacterManagement/CharacterManagement.vue';
import AccursedTowerManagement from '../components/admin/AccursedTowerManagement/AccursedTower.vue';

import UserPage from '../pages/UserPage.vue';
import ClanComponent from '../components/Account/ClanComponent.vue';
import ProfileComponent from '../components/Account/ProfileComponent.vue';
import HistoryComponent from '../components/Account/HistoryComponent.vue';
import SettingsComponent from '../components/Account/SettingsComponent.vue';

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

const routes: RouteRecordRaw[] = [
  {
    path: '/shadow-war',
    name: 'ShadowWar',
    component: ShadowWarPage,
    redirect: '/shadow-war/exalted',
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
    redirect: '/accursed-tower/1',
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
    path: '/a',
    name: 'Admin',
    redirect: '/a/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardPage,
        redirect: '/a/dashboard/shadow-war',
        children: [
          {
            path: 'shadow-war',
            name: 'DashboardShadowWar',
            component: ShadowWarManagement,
            meta: { title: 'Guerra Sombría' },
          },
          {
            path: 'accursed-tower',
            name: 'DashboardAccursedTower',
            component: AccursedTowerManagement,
            meta: { title: 'Torre Maldita' },
          },
          {
            path: 'history',
            name: 'DashboardHistory',
            component: HistoryManagement,
            meta: { title: 'Historial' },
            children: [
              {
                path: ':shadowwar_id',
                name: 'DashboardHistoryDetails',
                component: HistoryDetails,
                meta: { title: 'Historial' },
              },
            ],
          },
          {
            path: 'clans',
            name: 'DashboardClans',
            component: ClanManagement,
            meta: { title: 'Clanes' },
          },
          {
            path: 'members',
            name: 'DashboardMembers',
            component: CharacterManagement,
            meta: { title: 'Miembros' },
          },
          {
            path: 'users',
            name: 'DashboardUsers',
            component: UserManagement,
            meta: { title: 'Usuarios' },
          },
        ],
      },
    ]
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
        path: 'settings',
        name: 'Settings',
        component: SettingsComponent,
        meta: { title: 'Ajustes' },
      }
    ]
  },
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: { title: 'Inicio' },
    children: [
      {
        path: '/c/clan',
        name: 'Clan',
        component: ClanComponent,
        meta: { title: 'Clan' },
      },
      {
        path: '/c/history',
        name: 'History',
        component: HistoryComponent,
        meta: { title: 'Historial' },
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

export default router;
