<style scoped lang="scss" src="./AuthComponent.scss"/>
<script setup lang="ts">

import { useStore } from '../../middlewares/store/index';
import { useRoute, useRouter } from 'vue-router';
import { error } from '../../middlewares/misc/errors';
import LoaderComponent from '../utils/LoaderComponent.vue';

const store: any = useStore();
const route: any = useRoute();
const router: any = useRouter();
const userToken: any = route.params.token;

if(userToken === error.notFound) {
  router.push('/login/user-not-found');
} else {
  await store.handleUserData(userToken);
  router.push("/");
};

</script>

<template>
  <LoaderComponent />
</template>