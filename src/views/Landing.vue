<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth.js';
import landing from '../config/landing.js';
import AuthModal from '../components/AuthModal.vue';

const router = useRouter();
const { user, fetchMe, setToken } = useAuth();
const showAuth = ref(false);

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  if (tokenFromUrl) {
    setToken(tokenFromUrl);
    window.history.replaceState({}, '', '/tree/');
    await fetchMe();
    if (user.value?.tree) {
      router.replace('/' + user.value.tree.slug);
    } else {
      router.replace('/explore');
    }
    return;
  }

  await fetchMe();
  if (user.value) {
    router.replace('/explore');
  }
});

const onAuthSuccess = () => {
  router.replace('/explore');
};
</script>

<template>
  <div class="landing">
    <a v-if="landing.footer.github" :href="landing.footer.github" target="_blank" class="github-badge" title="GitHub">
      <svg class="github-svg" width="22" height="22" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6C29.304 70.25 17.816 66.01 17.816 47.018c0-5.54 2.023-10.103 5.176-13.608-.488-1.14-2.266-6.437.488-13.444 0 0 4.206-1.384 13.912 5.053a47.78 47.78 0 0 1 12.6-1.71c4.287 0 8.574.57 12.6 1.71 9.706-6.437 13.912-5.053 13.912-5.053 2.754 7.007.976 12.304.488 13.444 3.234 3.505 5.176 8.068 5.176 13.608 0 19.074-11.569 23.15-22.541 24.29 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="white"/>
      </svg>
    </a>

    <div class="hero">
      <h1 class="hero-title">{{ landing.title }}</h1>
      <p class="hero-subtitle">{{ landing.subtitle }}</p>
      <p class="hero-desc" v-html="landing.description"></p>

      <div class="hero-actions">
        <button class="btn-primary" @click="showAuth = true">
          {{ landing.cta.login }}
        </button>
        <router-link to="/explore" class="btn-secondary">
          {{ landing.cta.explore }}
        </router-link>
      </div>
    </div>

    <div class="features">
      <div
        v-for="(f, i) in landing.features"
        :key="i"
        class="feature-card"
      >
        <span class="feature-icon">{{ f.icon }}</span>
        <h3>{{ f.title }}</h3>
        <p>{{ f.desc }}</p>
      </div>
    </div>

    <footer class="landing-footer">
      <span>{{ landing.footer.text }}</span>
      <a v-if="landing.footer.github" :href="landing.footer.github" target="_blank" class="github-link">GitHub</a>
    </footer>

    <AuthModal
      :is-open="showAuth"
      @close="showAuth = false"
      @success="onAuthSuccess"
    />
  </div>
</template>

<style scoped>
.github-badge {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  text-decoration: none;
  transition: all 0.3s;
}
.github-badge:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}
.github-svg {
  display: block;
  flex-shrink: 0;
  opacity: 0.75;
}
.github-badge:hover .github-svg {
  opacity: 1;
}

.landing {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 0 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

/* --- Hero --- */
.hero {
  text-align: center;
  padding: 80px 0 40px;
  max-width: 560px;
}

.hero-title {
  font-family: 'Mountains of Christmas', cursive;
  font-size: 3.5rem;
  color: #f9f9f9;
  margin: 0 0 8px;
  text-shadow: 0 4px 12px rgba(139, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 1.15rem;
  color: #fbbf24;
  margin: 0 0 16px;
  font-weight: bold;
}

.hero-desc {
  color: #cbd5e1;
  font-size: 0.95rem;
  line-height: 1.7;
  margin: 0 0 28px;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

.btn-primary {
  padding: 12px 32px;
  background: linear-gradient(135deg, #d42426, #a31b1d);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.05rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(212, 36, 38, 0.4);
  transition: all 0.3s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 36, 38, 0.5);
}

.btn-secondary {
  padding: 12px 32px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 50px;
  font-size: 1.05rem;
  font-weight: bold;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

/* --- Features --- */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  max-width: 640px;
  width: 100%;
  padding-bottom: 40px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  transition: transform 0.2s, background 0.2s;
}
.feature-card:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.15);
}

.feature-icon {
  font-size: 2.2rem;
  display: block;
  margin-bottom: 8px;
}

.feature-card h3 {
  color: white;
  font-size: 1rem;
  margin: 0 0 6px;
}

.feature-card p {
  color: #94a3b8;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.5;
}

/* --- Footer --- */
.landing-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 0 40px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
}

.github-link {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.3);
  transition: color 0.2s;
}
.github-link:hover {
  color: white;
}

/* --- Mobile --- */
@media (max-width: 768px) {
  .hero {
    padding-top: 60px;
  }
  .hero-title {
    font-size: 2.4rem;
  }
  .features {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 400px) {
  .features {
    grid-template-columns: 1fr;
  }
}
</style>
