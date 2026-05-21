import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import Dashboard from '../views/Dashboard.vue'
import Perfil360View from '../views/Perfil360View.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/perfil-360',
      name: 'perfil360',
      component: Perfil360View,
      meta: { requiresAuth: true },
    },
    {
      path: '/panel',
      name: 'panel',
      component: Dashboard,
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
    return { name: 'login' }
  }

  if (to.name === 'login' && auth.isAuthenticated.value) {
    return { name: 'panel' }
  }

  return true
})

export default router
