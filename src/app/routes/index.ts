import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
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
import SettingsPage from '../pages/user/SettingsPage.vue';
import DashboardPage from '../pages/admin/DashboardPage.vue';
import ShadowWarManagement from '../components/admin/ShadowWarManagement/ShadowWar.vue';
import HistoryManagement from '../components/admin/HistoryManagement/HistoryManagement.vue';
import HistoryDetails from '../components/admin/HistoryManagement/HistoryDetails.vue';
import MemberManagement from '../components/admin/MemberManagement/MemberManagement.vue';
import UserManagement from '../components/admin/UserManagement/UserManagement.vue';
import EnemyClanManagement from '../components/admin/EnemyClanManagement/EnemyClanManagement.vue';
import PublicShadowWarPage from '../pages/PublicShadowWarPage.vue';
import ExaltedShadowWar from '../components/ShadowWar/ExaltedShadowWar.vue';
import EminentShadowWar from '../components/ShadowWar/EminentShadowWar.vue';
import FamedShadowWar from '../components/ShadowWar/FamedShadowWar.vue';
import ProudShadowWar from '../components/ShadowWar/ProudShadowWar.vue';
import TasksComponent from '../components/Tasks/TasksComponent.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/shadow-war',
    name: 'PublicShadowWar',
    component: PublicShadowWarPage,
    redirect: '/shadow-war/exalted',
    children: [
      {
        path: 'exalted',
        name: 'PublicShadowWarExalted',
        component: ExaltedShadowWar,
        meta: { title: 'Guerra Sombría' },
      },
      {
        path: 'eminent',
        name: 'PublicShadowWarEminent',
        component: EminentShadowWar,
        meta: { title: 'Guerra Sombría' },
      },
      {
        path: 'famed',
        name: 'PublicShadowWarFamed',
        component: FamedShadowWar,
        meta: { title: 'Guerra Sombría' },
      },
      {
        path: 'proud',
        name: 'PublicShadowWarProud',
        component: ProudShadowWar,
        meta: { title: 'Guerra Sombría' },
      },
    ],
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    redirect: '/dashboard/shadow-war',
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
  {
    path: '/u/settings',
    name: 'SettingsPage',
    component: SettingsPage
  },
  {
    path: '/',
    name: 'HomePage',
    component: HomePage
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
