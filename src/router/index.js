import { createRouter, createWebHistory } from 'vue-router';
import Landing from '../views/Landing.vue';
import Home from '../views/Home.vue';
import About from '../views/About.vue';
import FollowedTrees from '../views/FollowedTrees.vue';
import TreeView from '../views/TreeView.vue';

const router = createRouter({
  history: createWebHistory('/tree/'),
  routes: [
    { path: '/', name: 'Landing', component: Landing },
    { path: '/explore', name: 'Home', component: Home },
    { path: '/about', name: 'About', component: About },
    { path: '/followed', name: 'FollowedTrees', component: FollowedTrees },
    { path: '/:slug', name: 'TreeView', component: TreeView, props: true },
  ],
});

export default router;
