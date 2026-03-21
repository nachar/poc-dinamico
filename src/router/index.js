import { createRouter, createWebHistory } from 'vue-router'
import MenuList from '../components/MenuList.vue'
import CheckoutOrder from '../components/CheckoutOrder.vue'

const routes = [
  {
    path: '/',
    name: 'MenuList',
    component: MenuList
  },
  {
    path: '/checkout-order',
    name: 'CheckoutOrder',
    component: CheckoutOrder
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
