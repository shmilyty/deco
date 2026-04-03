<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth.js';
import TreeList from '../components/TreeList.vue';
import AuthModal from '../components/AuthModal.vue';

const router = useRouter();
const { user, isLoading, fetchMe, setToken, getApiBase, getAuthHeaders } = useAuth();
const creatingTree = ref(false);
const showAuthModal = ref(false);

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  if (tokenFromUrl) {
    setToken(tokenFromUrl);
    window.history.replaceState({}, '', '/tree/explore');
  }

  await fetchMe();

  if (tokenFromUrl && user.value && user.value.tree) {
    router.replace('/' + user.value.tree.slug);
  }
});

const createError = ref('');

const createTree = async () => {
  creatingTree.value = true;
  createError.value = '';
  try {
    const res = await fetch(`${getApiBase()}/trees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ title: 'My Christmas Tree' })
    });
    const result = await res.json();
    if (result.success) {
      router.push('/' + result.tree.slug);
    } else if (result.tree) {
      router.push('/' + result.tree.slug);
    } else {
      createError.value = result.error || '创建失败';
    }
  } catch (err) {
    console.error('Create tree failed:', err);
    createError.value = '网络错误: ' + err.message;
  } finally {
    creatingTree.value = false;
  }
};

const onAuthSuccess = () => {
  if (user.value && user.value.tree) {
    router.push('/' + user.value.tree.slug);
  }
};
</script>

<template>
  <div class="home-container">
    <div class="header-area">
      <h1>Deco My Tree</h1>
      <div v-if="isLoading" class="auth-status">
        <p>Loading...</p>
      </div>
      <div v-else-if="!user" class="auth-section">
        <p>登录后可以创建属于自己的圣诞树</p>
        <button class="login-btn" @click="showAuthModal = true">
          <span class="btn-icon">🎄</span>
          登录 / 注册
        </button>
      </div>
      <div v-else-if="!user.tree" class="auth-section">
        <p>欢迎, {{ user.username }}!</p>
        <button class="create-btn" @click="createTree" :disabled="creatingTree">
          {{ creatingTree ? '种树中...' : '种下我的圣诞树' }}
        </button>
        <p v-if="createError" class="error-text">{{ createError }}</p>
      </div>
    </div>

    <div class="list-area">
      <TreeList />
    </div>

    <AuthModal
      :is-open="showAuthModal"
      @close="showAuthModal = false"
      @success="onAuthSuccess"
    />
  </div>
</template>

<style>
.home-container {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.home-container::-webkit-scrollbar {
  display: none;
}
</style>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 20px;
  box-sizing: border-box;
}

.header-area {
  text-align: center;
  flex-shrink: 0;
  margin-bottom: 20px;
  z-index: 5;
}

h1 {
  font-family: 'Mountains of Christmas', cursive;
  color: #f9f9f9;
  margin-bottom: 5px;
  text-shadow: 0 4px 6px rgba(139, 0, 0, 0.6);
  font-size: 2.5rem;
}

p {
  color: #cbd5e1;
  margin-top: 0;
  font-size: 0.9rem;
}

.auth-section {
  margin-top: 10px;
}

.login-btn,
.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.login-btn {
  background: linear-gradient(135deg, #d42426, #a31b1d);
  color: white;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(212, 36, 38, 0.4);
}

.create-btn {
  background: linear-gradient(135deg, #165b33, #0d3d22);
  color: white;
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 91, 51, 0.4);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.2rem;
}

.error-text {
  color: #f87171;
  font-size: 0.85rem;
  margin-top: 8px;
}

.list-area {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding-bottom: 40px;
}

@media (max-width: 768px) {
  .home-container {
    padding-top: 90px;
  }

  h1 {
    font-size: 1.8rem;
    margin: 0 0 10px 0;
  }
}
</style>
