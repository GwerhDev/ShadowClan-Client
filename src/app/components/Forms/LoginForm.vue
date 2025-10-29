<script setup lang="ts">
import { useStore } from '../../../middlewares/store/index';
import { useRouter } from 'vue-router';
import { onMounted, computed } from 'vue';
import { getUserToken } from '../../../helpers';
import { API_URL } from '../../../middlewares/misc/const';
import BackButton from '../Buttons/BackButton.vue';
import blizzIcon from '../../../assets/svg/blizz-icon.svg';

const store: any = useStore();
const router: any = useRouter();
const currentUser: any = computed(() => store.currentUser);

let token: string = getUserToken() || "";
let urlSignup: string = "/signup";
let urlLogin: string = API_URL + "/login-bnet";

onMounted(() => {
  if (currentUser?.logged && token) router.push('/');
});

</script>

<template>
  <form class="signup-form">
    <a class="button" :href="urlLogin">
      <img :src="blizzIcon" alt="" height="25px">
      Iniciar sesión con Battle.net
    </a>
    <BackButton></BackButton>
  </form>
  <div class="d-flex justify-content-center align-items-center w-100 mt-1 g-1">
    <div class="divider"></div> O <div class="divider"></div>
  </div>
  <div class="login-form">
    <p>¿Aún no estás registrado?</p>
    <a class="no-button" :href="urlSignup">
      <img :src="blizzIcon" alt="" height="25px">
      Registrarse
    </a>
  </div>
</template>

<style scoped lang="scss" src="./LoginForm.scss" />