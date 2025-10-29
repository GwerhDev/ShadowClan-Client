import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';
import AuthPage from '../pages/AuthPage.vue';
import SignupPage from '../pages/SignupPage.vue';
import LoginErrorPage from '../pages/LoginErrorPage.vue';
import UserPendingPage from '../pages/UserPendingPage.vue';
import UserInactivePage from '../pages/UserInactivePage.vue';
import UserNotFoundPage from '../pages/UserNotFoundPage.vue';
import RegisterErrorPage from '../pages/RegisterErrorPage.vue';
import RegisterSuccessPage from '../pages/RegisterSuccessPage.vue';
import AlreadyRegisteredPage from '../pages/AlreadyRegisteredPage.vue';
import TasksPage from '../pages/TasksPage.vue';
import UserPage from '../pages/UserPage.vue';
import DashboardPage from '../pages/admin/DashboardPage.vue';
import ShadowWarManagement from '../components/admin/ShadowWarManagement/ShadowWar.vue';
import HistoryManagement from '../components/admin/HistoryManagement/HistoryManagement.vue';
import HistoryDetails from '../components/admin/HistoryManagement/HistoryDetails.vue';
import MemberManagement from '../components/admin/MemberManagement/MemberManagement.vue';
import UserManagement from '../components/admin/UserManagement/UserManagement.vue';
import EnemyClanManagement from '../components/admin/EnemyClanManagement/EnemyClanManagement.vue';
import ShadowWarPage from '../pages/ShadowWarPage.vue';
import ExaltedShadowWar from '../components/ShadowWar/ExaltedShadowWar.vue';
import EminentShadowWar from '../components/ShadowWar/EminentShadowWar.vue';
import FamedShadowWar from '../components/ShadowWar/FamedShadowWar.vue';
import ProudShadowWar from '../components/ShadowWar/ProudShadowWar.vue';
import TasksComponent from '../components/Tasks/TasksComponent.vue';
import ProfileComponent from '../components/Account/ProfileComponent.vue';
import ClanComponent from '../components/Account/ClanComponent.vue';
import HistoryComponent from '../components/Account/HistoryComponent.vue';
import SettingsComponent from '../components/Account/SettingsComponent.vue';
import AccursedTowerPage from '../pages/AccursedTowerPage.vue';
import LoginPage from '../pages/LoginPage.vue';

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
    redirect: '/accursed-tower/exalted',
    children: [
      {
        path: 'exalted',
        name: 'Tower',
        component: ExaltedShadowWar,
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
            component: EnemyClanManagement,
            meta: { title: 'Clanes' },
          },
          {
            path: 'members',
            name: 'DashboardMembers',
            component: MemberManagement,
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
    path: '/',
    name: 'UserPage',
    component: UserPage,
    redirect: '/u/profile',
    meta: { title: 'Social' },
    children: [
      {
        path: '/u/profile',
        name: 'Profile',
        component: ProfileComponent,
        meta: { title: 'Perfil' },
      },
      {
        path: '/u/clan',
        name: 'Clan',
        component: ClanComponent,
        meta: { title: 'Clan' },
      },
      {
        path: '/u/history',
        name: 'History',
        component: HistoryComponent,
        meta: { title: 'Historial' },
      },
      {
        path: '/u/settings',
        name: 'Settings',
        component: SettingsComponent,
        meta: { title: 'Ajustes' },
      }
    ]
  },
  {
    path: '/login',
    name: 'LoginPage',
    component: LoginPage
  },
  {
    path: '/signup',
    name: 'SignupPage',
    component: SignupPage
  },
  {
    path: '/signup/already-registered',
    name: 'AlreadyRegisteredPage',
    component: AlreadyRegisteredPage
  },
  {
    path: '/signup/register-success',
    name: 'RegisterSuccessPage',
    component: RegisterSuccessPage
  },
  {
    path: '/login/user-not-found',
    name: 'UserNotFoundPage',
    component: UserNotFoundPage
  },
  {
    path: '/login/user-pending-approve',
    name: 'UserPendingPage',
    component: UserPendingPage
  },
  {
    path: '/login/user-inactive',
    name: 'UserInactivePage',
    component: UserInactivePage
  },
  {
    path: '/login/login-error',
    name: 'LoginErrorPage',
    component: LoginErrorPage
  },
  {
    path: '/signup/register-error',
    name: 'RegisterErrorPage',
    component: RegisterErrorPage
  },
  {
    path: '/auth/:token',
    name: 'AuthPage',
    component: AuthPage
  },
  {
    path: '/tasks',
    name: 'TasksPage',
    component: TasksPage,
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
