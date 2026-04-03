
<script setup>
import SnowBackground from './components/SnowBackground.vue';
import Countdown from './components/Countdown.vue';
import AuthModal from './components/AuthModal.vue';
import { useRoute } from 'vue-router';
import { useAuth } from './composables/useAuth.js';
import { onMounted, ref, onBeforeUnmount } from 'vue';

const route = useRoute();
const { user, fetchMe, setToken, logout } = useAuth();
const showDropdown = ref(false);
const showAuthModal = ref(false);

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const handleLogout = () => {
  showDropdown.value = false;
  logout();
};

const closeDropdown = (e) => {
  if (!e.target.closest('.auth-area')) {
    showDropdown.value = false;
  }
};

onMounted(async () => {
  document.addEventListener('click', closeDropdown);
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  if (tokenFromUrl) {
    setToken(tokenFromUrl);
    window.history.replaceState({}, '', window.location.pathname);
  }
  await fetchMe();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown);
});
</script>

<template>
  <div class="app-container">
    <SnowBackground />
    <Countdown v-if="route.name !== 'Landing'" />

    <router-link
      v-if="route.name !== 'About' && route.name !== 'Landing'"
      to="/about"
      class="about-link"
      title="关于本站"
    >
      <span class="icon">ℹ️</span>
      <span class="text">About</span>
    </router-link>

    <!-- Auth UI -->
    <div class="auth-area" v-if="route.name !== 'About' && route.name !== 'Landing'">
      <template v-if="user">
        <div class="user-info" @click.stop="toggleDropdown">
          <img v-if="user.avatarUrl" :src="user.avatarUrl" class="user-avatar" />
          <span class="user-name">{{ user.username }}</span>
          <span v-if="user.isAdmin" class="admin-badge">Admin</span>
          <span class="dropdown-arrow" :class="{ open: showDropdown }">▾</span>
        </div>
        <Transition name="dropdown">
          <div v-if="showDropdown" class="user-dropdown">
            <router-link v-if="user.tree" :to="'/' + user.tree.slug" class="dropdown-item" @click="showDropdown = false">
              🎄 我的树
            </router-link>
            <router-link v-if="user.followedTrees?.length" to="/followed" class="dropdown-item" @click="showDropdown = false">
              ⭐ 关注的树
            </router-link>
            <router-link to="/explore" class="dropdown-item" @click="showDropdown = false">
              🏠 所有树
            </router-link>
            <button class="dropdown-item logout" @click="handleLogout">
              👋 退出登录
            </button>
          </div>
        </Transition>
      </template>
      <button v-else class="auth-btn" @click="showAuthModal = true" title="登录">登录</button>
    </div>

    <AuthModal
      :is-open="showAuthModal"
      @close="showAuthModal = false"
      @success="showAuthModal = false"
    />

    <div class="content">
      <router-view v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </div>
  </div>
</template>

<style>
.app-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  position: relative;
  z-index: 10;
}

/* 关于按钮样式 */
.about-link {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 60;

  display: flex;
  align-items: center;
  gap: 5px;

  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  padding: 8px 15px;
  border-radius: 30px;
  text-decoration: none;
  color: white;
  font-weight: bold;
  font-family: 'Nunito', sans-serif;
  border: 1px solid rgba(255,255,255,0.3);
  transition: all 0.3s;
}

.about-link:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
}

/* Auth 区域 */
.auth-area {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 8px;
  /* For dropdown positioning */
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
  padding: 5px 12px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.25);
}

.dropdown-arrow {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.7rem;
  transition: transform 0.2s;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  overflow: hidden;
  min-width: 140px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  color: white;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  box-sizing: border-box;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-item.logout {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #f87171;
}

/* Dropdown animation */
.dropdown-enter-active { transition: all 0.2s ease; }
.dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.user-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  color: white;
  font-size: 0.85rem;
  font-weight: bold;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-badge {
  background: #fbbf24;
  color: #333;
  font-size: 0.6rem;
  padding: 1px 5px;
  border-radius: 8px;
  font-weight: bold;
}

.auth-btn {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 14px;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.auth-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .auth-area {
    right: 20px;
    top: 20px;
  }

  .user-info {
    padding: 4px 8px;
  }

  .user-name {
    max-width: 50px;
    font-size: 0.75rem;
  }

  .auth-btn {
    padding: 5px 10px;
    font-size: 0.75rem;
  }

  .user-dropdown {
    min-width: 120px;
  }
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
/* 全局样式重置 */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}
body::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  background: radial-gradient(circle at 50% 20%, #1e293b 0%, #0f172a 100%);
  background-size: cover;
  background-repeat: no-repeat;
}
h1, h2, h3, .title {
  font-family: 'Mountains of Christmas', cursive;
  font-weight: 700;
}
@media (max-width: 768px) {
  body.reading-mode .countdown-container {
    opacity: 0 !important;
    pointer-events: none !important;
    transform: translateX(-50%) translateY(-20px) !important;
    transition: all 0.3s ease;
  }
}

#app {
  width: 100%;
  min-height: 100%;
}
</style>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}
h1 {
  font-size: 2.5rem;
  margin: 10px 0;
  color: white
}
p {
  color: #94a3b8;
  font-size: 0.9rem;
}
</style>
