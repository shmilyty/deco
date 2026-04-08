<script setup>
import { ref, watch } from 'vue';
import { useAuth } from '../composables/useAuth.js';

const props = defineProps({ isOpen: Boolean });
const emit = defineEmits(['close', 'success']);
const { getApiBase, setToken, fetchMe } = useAuth();

const mode = ref('login');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const username = ref('');
const error = ref('');
const loading = ref(false);
const successMsg = ref('');
const needVerify = ref(false);

watch(() => props.isOpen, (val) => {
  if (val) {
    error.value = '';
    successMsg.value = '';
    needVerify.value = false;
  }
});

const switchMode = (m) => {
  mode.value = m;
  error.value = '';
  successMsg.value = '';
  needVerify.value = false;
};

const handleLogin = async () => {
  error.value = '';
  if (!email.value || !password.value) {
    error.value = '请填写邮箱和密码';
    return;
  }
  loading.value = true;
  try {
    const res = await fetch(`${getApiBase()}/auth/email-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    });
    const data = await res.json();
    if (data.success) {
      setToken(data.token);
      await fetchMe();
      emit('success');
      emit('close');
    } else {
      if (data.needVerify) {
        needVerify.value = true;
      }
      error.value = data.error;
    }
  } catch (err) {
    error.value = '网络错误';
  } finally {
    loading.value = false;
  }
};

const handleSignup = async () => {
  error.value = '';
  if (!email.value || !password.value || !username.value) {
    error.value = '请填写所有字段';
    return;
  }
  if (password.value.length < 8) {
    error.value = '密码至少需要 8 位';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = '两次密码输入不一致';
    return;
  }
  loading.value = true;
  try {
    const res = await fetch(`${getApiBase()}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        username: username.value,
      }),
    });
    const data = await res.json();
    if (data.success) {
      if (data.token) {
        setToken(data.token);
        await fetchMe();
        emit('success');
        emit('close');
      } else {
        successMsg.value = data.message;
        mode.value = 'login';
      }
    } else {
      error.value = data.error;
    }
  } catch (err) {
    error.value = '网络错误';
  } finally {
    loading.value = false;
  }
};

const resendVerify = async () => {
  try {
    await fetch(`${getApiBase()}/auth/resend-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    });
    successMsg.value = '验证邮件已重新发送，请查收';
    needVerify.value = false;
  } catch (err) {
    error.value = '发送失败';
  }
};

const oauthLogin = () => {
  window.location.href = import.meta.env.PROD
    ? '/tree/api/auth/login'
    : 'http://localhost:3000/api/auth/login';
};
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="auth-overlay" @click.self="$emit('close')">
      <div class="auth-card">
        <button class="close-btn" @click="$emit('close')">✕</button>

        <h3>{{ mode === 'login' ? '登录' : '注册' }}</h3>

        <div v-if="successMsg" class="success-banner">{{ successMsg }}</div>

        <!-- Tab switcher -->
        <div class="tab-row">
          <button :class="{ active: mode === 'login' }" @click="switchMode('login')">登录</button>
          <button :class="{ active: mode === 'signup' }" @click="switchMode('signup')">注册</button>
        </div>

        <!-- Login form -->
        <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="auth-form">
          <input v-model="email" type="email" placeholder="邮箱" autocomplete="email" />
          <input v-model="password" type="password" placeholder="密码" autocomplete="current-password" />
          <p v-if="error" class="error-text">{{ error }}</p>
          <button v-if="needVerify" type="button" class="link-btn" @click="resendVerify">
            重新发送验证邮件
          </button>
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? '登录中...' : '邮箱登录' }}
          </button>
        </form>

        <!-- Signup form -->
        <form v-if="mode === 'signup'" @submit.prevent="handleSignup" class="auth-form">
          <input v-model="username" type="text" placeholder="用户名" maxlength="50" autocomplete="username" />
          <input v-model="email" type="email" placeholder="邮箱" autocomplete="email" />
          <input v-model="password" type="password" placeholder="密码（至少 8 位）" autocomplete="new-password" />
          <input v-model="confirmPassword" type="password" placeholder="确认密码" autocomplete="new-password" />
          <p v-if="error" class="error-text">{{ error }}</p>
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>

        <div class="divider"><span>或</span></div>

        <button class="oauth-btn" @click="oauthLogin">
          <span class="oauth-icon">🔗</span>
          用 LinuxDo 账号登录
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.auth-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.auth-card {
  position: relative;
  background: #fffbf0;
  border: 4px solid #d42426;
  border-radius: 16px;
  padding: 30px;
  width: min(92vw, 380px);
  max-height: 85dvh;
  overflow-y: auto;
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.close-btn {
  position: absolute;
  top: 10px; right: 10px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
}

h3 {
  text-align: center;
  color: #d42426;
  margin: 0 0 16px 0;
  font-family: 'Georgia', serif;
}

.tab-row {
  display: flex;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #d42426;
  margin-bottom: 20px;
}
.tab-row button {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  color: #d42426;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-row button.active {
  background: #d42426;
  color: white;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-form input {
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
  background: white;
  color: #333;
}
.auth-form input:focus {
  border-color: #d42426;
}

.submit-btn {
  padding: 12px;
  background: #d42426;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.error-text {
  color: #ef4444;
  font-size: 0.85rem;
  margin: 0;
  text-align: center;
}

.success-banner {
  background: #d1fae5;
  color: #065f46;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  text-align: center;
  margin-bottom: 12px;
}

.link-btn {
  background: none;
  border: none;
  color: #d42426;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 16px;
  color: #999;
  font-size: 0.8rem;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ddd;
}

.oauth-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 50px;
  background: white;
  color: #333;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.oauth-btn:hover {
  border-color: #999;
  background: #f9f9f9;
}
.oauth-icon {
  font-size: 1.1rem;
}

@media (max-width: 380px) {
  .auth-card { padding: 20px; border-width: 3px; }
}
</style>
