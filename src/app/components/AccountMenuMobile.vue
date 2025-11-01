<style scoped lang="scss" src="./AccountMenuMobile.scss" />
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { $d, $display } from '../../functions';
import { useStore } from '../../middlewares/store';
import { API_URL } from '../../middlewares/misc/const';
import DashboardButton from './admin/DashboardButton.vue';

const store: any = useStore();
const router: any = useRouter();

let urlLogin: string = API_URL + "/login-bnet" || "";

function handleButton() {
  $display("#account-menu-mobile");
};

document.addEventListener('mouseup', function (e) {
  const container = $d('#account-menu-mobile');
  if (!container?.contains(e.target)) {
    return (
      $d('#account-menu-mobile').style.display = 'none'
    )
  }
  return;
});

function handleSignup() {
  $d('#account-menu-mobile').style.display = 'none'
  router.push('/signup');
};

function handleSettings() {
  $d('#account-menu-mobile').style.display = 'none'
  router.push('/u/settings');
};

function handleLogout() {
  store.logout();
  router.push('/');
};

</script>

<template>
  <div class="account-menu" id="account-menu-mobile">
    <div class="top-menu">
      <div></div>
      <p class="logo-styles canvas-logo">ShadowClann</p>
      <span @click="handleButton"><img src="../../assets/svg/close-icon.svg" alt="" height="25px"></span>
    </div>
    <div class="inner-container">
      <span class="user-data" v-if="store.currentUser?.userData">
        <p class="battletag">
          <span>{{ store.currentUser?.userData?.username }}</span>
          #{{ store.currentUser?.userData?.discriminator }}
        </p>
        <p class="role">{{ store.currentUser?.userData?.role }}</p>
      </span>
      <span v-else>
        <a class="button justify-content-center align-items-center d-flex g-1 mb-0" :href="urlLogin">
          <img src="../../assets/svg/blizz-icon.svg" alt="" height="25px">
          Iniciar sesión
        </a>
      </span>
      <ul>
        <li @click="handleSignup" v-if="!store.currentUser?.userData">
          <img src="../../assets/svg/edit-icon.svg" alt="">
          Registrarme
        </li>

        <li @click="handleSettings" v-if="store.currentUser?.userData">
          <img src="../../assets/svg/settings-icon.svg" alt="">
          Ajustes de tu cuenta
        </li>

        <li @click="handleLogout" v-if="store.currentUser?.userData">
          <img src="../../assets/svg/logout-icon.svg" alt="">
          Cerrar sesión
        </li>

      </ul>
    </div>
    <div class="darker-menu inner-container">
      <ul>
        <li>
          <img src="../../assets/svg/support-icon.svg" alt="">
          Asistencia
        </li>
        <span class="dashboard-container" @click="handleButton" v-if="store.currentUser?.userData?.role === 'admin' || store.currentUser?.userData?.role === 'super_admin'">
          <DashboardButton />
        </span>
      </ul>
    </div>
  </div>
</template>