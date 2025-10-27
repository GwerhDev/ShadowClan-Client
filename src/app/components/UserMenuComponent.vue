<style scoped lang="scss" src="./UserMenuComponent.scss"/>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useStore } from '../../middlewares/store';
import { $d } from '../../functions';
import { API_URL } from '../../middlewares/misc/const';

const store: any = useStore();
const router: any = useRouter();

let urlLogin: string = API_URL + "/login-bnet" || "";

document.addEventListener('mouseup', function (e) {
  const container = $d('#user-menu-container');
  if (!container?.contains(e.target)) {
    return $d('#user-menu-container').style.display = 'none';
  };
  
  return;
});

function handleSignup() {
  $d('#user-menu-container').style.display = 'none';
  router.push('/signup');
};

function handleSettings() {
  $d('#user-menu-container').style.display = 'none';
  router.push('/u/settings');
};

function handleLogout() {
  $d('#user-menu-container').style.display = 'none';
  store.logout();
  router.push('/');
};

</script>

<template>
  <div class="container" id="user-menu-container">
    <div class="inner-container">
      <span class="user-data" v-if="store.currentUser?.userData">
        <p class="battletag"><span>{{ store.currentUser?.userData?.username }}</span>#{{
          store.currentUser?.userData?.discriminator }}</p>
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
      </ul>
    </div>
  </div>
</template>