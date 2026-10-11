import 'vant/lib/index.css';
import '@/shared/theme.css';
import { createPinia } from 'pinia';
import Vant from 'vant';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';

createApp(App).use(createPinia()).use(router).use(Vant).mount('#app');
