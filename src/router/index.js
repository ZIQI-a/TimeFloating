import { createRouter, createWebHashHistory } from 'vue-router';
import MainPanel from '../views/MainPanel.vue';
import FloatingWindow from '../views/FloatingWindow.vue';

const routes = [
  {
    path: '/',
    name: 'Main',
    component: MainPanel
  },
  {
    path: '/floating',
    name: 'Floating',
    component: FloatingWindow
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
