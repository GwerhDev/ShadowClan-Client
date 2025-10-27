<style scoped lang="scss" src="./DashboardButton.scss"/>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useStore } from '../../../middlewares/store';
import { $d } from '../../../functions';
import { onMounted } from "vue";

const store: any = useStore();
const router: any = useRouter();

onMounted(async() => {
  try {
    await store.handleGetAdminNotifications();
  } catch (error) {
    console.error(error);
  } finally {
  }
});

function handleClick() {
  $d('#nav-menu-mobile').style.display = 'none';
  router.push('/dashboard');
};

</script>

<template>
  <span class="dashboard-container" v-if="store.currentUser?.userData?.role === 'admin'">
    <button class="nav-button" @click="handleClick">
      <p>Dashboard</p>
      <span v-if="store.admin?.notifications?.counter">{{ store.admin?.notifications?.counter }}</span>
    </button>
  </span>
</template>