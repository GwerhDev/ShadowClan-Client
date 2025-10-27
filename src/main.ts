import './styles/style.css';
import './styles/root.css';
import '@fortawesome/fontawesome-free/css/all.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './app/routes';

createApp(App)
  .use(createPinia())
  .use(router)
  .mount('#app');