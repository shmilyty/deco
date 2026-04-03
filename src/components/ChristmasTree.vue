<script setup>
import ChristmasCard from './ChristmasCard.vue';
import { ref, onMounted, computed } from 'vue';
import { useAuth } from '../composables/useAuth.js';

const props = defineProps({
  treeSlug: { type: String, required: true }
});

const { getAuthHeaders, fetchMe, getApiBase } = useAuth();
const API_URL = computed(() => `${getApiBase()}/trees/${props.treeSlug}/decorations`);

const decorations = ref([]);
const isChristmas = ref(false);
const isLoading = ref(true);
const isModalOpen = ref(false);
const modalMode = ref('write');
const selectedDecoration = ref(null);
const pendingPoint = ref(null);
const showFullModal = ref(false);
const showSuccessToast = ref(false);
const PAGE_SIZE = 10;
const currentPage = ref(0);

const totalTrees = computed(() => {
  if (decorations.value.length === 0) return 1;
  return Math.ceil(decorations.value.length / PAGE_SIZE);
});

const currentTreeDecorations = computed(() => {
  const start = currentPage.value * PAGE_SIZE;
  return decorations.value.slice(start, start + PAGE_SIZE);
});

const prevTree = () => {
  if (currentPage.value > 0) currentPage.value--;
};

const nextTree = () => {
  if (currentPage.value < totalTrees.value - 1) {
    currentPage.value++;
  } else if (currentTreeDecorations.value.length === PAGE_SIZE) {
    currentPage.value++;
  }
};

const fetchDecorations = async () => {
  isLoading.value = true;
  try {
    const res = await fetch(API_URL.value, {
      headers: { ...getAuthHeaders() }
    });
    const result = await res.json();
    decorations.value = result.data;
    isChristmas.value = result.isUnlocked;
  } catch (err) {
    console.error('Failed to load decorations:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchDecorations();
});

const handleTreeClick = (event) => {
  if (event.target.closest('.decoration')) return;

  if (currentTreeDecorations.value.length >= PAGE_SIZE) {
    showFullModal.value = true;
    return;
  }

  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  pendingPoint.value = { x: x.toFixed(2), y: y.toFixed(2) };
  modalMode.value = 'write';
  selectedDecoration.value = null;
  isModalOpen.value = true;
};

const handleDecorationClick = (item) => {
  modalMode.value = 'read';
  selectedDecoration.value = item;
  isModalOpen.value = true;
};

const handleGoToNewTree = () => {
  const lastPageIdx = Math.ceil(decorations.value.length / PAGE_SIZE) - 1;
  const lastPageCount = decorations.value.length % PAGE_SIZE;

  if (lastPageCount === 0 && decorations.value.length > 0) {
    currentPage.value = lastPageIdx + 1;
  } else {
    currentPage.value = Math.max(0, lastPageIdx);
  }
  showFullModal.value = false;
};

const handleSubmit = async (formData) => {
  try {
    const payload = new FormData();
    payload.append('x', pendingPoint.value.x);
    payload.append('y', pendingPoint.value.y);
    payload.append('icon', formData.icon);
    payload.append('nickname', formData.nickname);
    payload.append('content', formData.content);
    payload.append('isPrivate', formData.isPrivate);
    payload.append('token', formData.token);
    if (formData.images && formData.images.length) {
      formData.images.forEach(file => {
        payload.append('images', file);
      });
    }

    const res = await fetch(API_URL.value, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: payload
    });

    const result = await res.json();

    if (result.success) {
      await fetchDecorations();
      fetchMe();
      closeModal();
      const lastPage = Math.ceil(decorations.value.length / PAGE_SIZE) - 1;
      currentPage.value = Math.max(0, lastPage);
      showSuccessToast.value = true;
      setTimeout(() => { showSuccessToast.value = false; }, 2000);
    } else {
      alert(result.error);
    }
  } catch (err) {
    console.error('Submit failed:', err);
  }
};

const closeModal = () => {
  isModalOpen.value = false;
  pendingPoint.value = null;
};
</script>

<template>
  <div class="tree-wrapper">
    <div class="tree-container" @click="handleTreeClick">
      <img src="/tree.png" alt="Christmas Tree" class="tree-img" />
      <div v-if="isLoading" class="loading-text">
        正在从北极运送礼物... 🦌
      </div>
    <div 
        v-for="item in currentTreeDecorations" 
        :key="item.id"
        class="decoration"
        :style="{ left: item.x + '%', top: item.y + '%' }"
        @click.stop="handleDecorationClick(item)" 
      >
        <img :src="item.icon" class="tree-decoration-img" />
      </div>

      <div 
        v-if="pendingPoint" 
        class="pending-dot"
        :style="{ left: pendingPoint.x + '%', top: pendingPoint.y + '%' }"
      ></div>
    </div>
    
    <div class="tree-pagination">
      <button 
        class="nav-arrow" 
        @click="prevTree" 
        :disabled="currentPage === 0"
      >
        ◀
      </button>
      
      <div class="page-info">
        🎁
        <span class="count">{{ currentTreeDecorations.length }}</span>
        <span class="divider">/</span>
        <span class="limit">{{ PAGE_SIZE }}</span>
      </div>
      
      <button 
        class="nav-arrow" 
        @click="nextTree"
        :disabled="currentTreeDecorations.length < PAGE_SIZE && currentPage >= totalTrees - 1"
      >
        ▶
      </button>
    </div>
    <div class="tree-modals">
    <Transition name="pop">
      <div v-if="showFullModal" class="custom-modal-overlay">
        <div class="custom-modal">
          <div class="modal-icon">🎄</div>
          <h3>这棵树有点挤啦！</h3>
          <p>当前树已经挂满了 {{ PAGE_SIZE }} 个礼物。<br>要前往一棵新的树继续挂吗？</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showFullModal = false">我就看看</button>
            <button class="btn-confirm" @click="handleGoToNewTree">去新树 ➔</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="slide-up">
      <div v-if="showSuccessToast" class="success-toast">
        <span class="toast-icon">✨</span>
        <div class="toast-text">
          <h4>挂上去啦！</h4>
          <p>你的祝福已经送达</p>
        </div>
      </div>
    </Transition>

  </div>
    <ChristmasCard 
      :is-open="isModalOpen"
      :mode="modalMode"
      :data="selectedDecoration"
      :locked="!isChristmas"
      @close="closeModal"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped>
.tree-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 10px;
}

.tree-container {
  position: relative;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto;
  cursor: crosshair;
}

.tree-img {
  width: auto;
  height: auto;
  display: block;
  user-select: none;
  margin: 0 auto;
  max-height: 70vh;
  max-width: 100%;
  object-fit: contain;
  object-position: bottom center;
}

@media (max-width: 768px) {
  .tree-img {
    max-height: 60vh;
    max-height: calc(100dvh - 180px);
    width: 100%;
  }
  .home-container {
    justify-content: flex-start;
    padding-top: 85px;
    padding-bottom: 0;
  }
  .header-area {
    margin-bottom: 5px;
    flex-shrink: 0;
    z-index: 5;
  }
  h1 {
    font-size: 2rem;
    margin: 0;
    line-height: 1.2;
  }
}

.decoration {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 5;
  transform-origin: top center;
  animation: swing 3s ease-in-out infinite;
  display: flex;
  justify-content: center;
  align-items: center;
}
.decoration:hover {
  animation-play-state: paused;
  transform: translate(-50%, -50%) scale(1.3) rotate(0deg);
  z-index: 10;
  filter: drop-shadow(0 0 10px gold);
}

.pending-dot { position: absolute; width: 10px; height: 10px; background: red; border-radius: 50%; transform: translate(-50%, -50%); animation: pulse 1s infinite; z-index: 6; }
@keyframes pulse { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(2); opacity: 0; } }
@keyframes swing {
  0% { transform: translate(-50%, -50%) rotate(5deg); }
  50% { transform: translate(-50%, -50%) rotate(-5deg); }
  100% { transform: translate(-50%, -50%) rotate(5deg); }
}
.decoration:nth-child(2n) { animation-duration: 3.5s; animation-delay: 0.5s; }
.decoration:nth-child(3n) { animation-duration: 4s; animation-delay: 1s; }
.decoration:nth-child(5n) { animation-duration: 2.8s; animation-delay: 1.5s; }

.loading-text {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.7);
  padding: 10px 20px;
  border-radius: 20px;
  color: white;
  z-index: 20;
}

.tree-decoration-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.tree-pagination {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  padding: 10px 20px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 20;
  max-width: 90%;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .tree-pagination {
    bottom: calc(60px + env(safe-area-inset-bottom));
    padding: 6px 10px;
    gap: 15px;
  }
  .nav-arrow {
    font-size: 1.8rem;
    padding: 0 15px;
  }
}

.nav-arrow {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 10px;
  transition: all 0.2s;
  opacity: 0.8;
}
.nav-arrow:hover:not(:disabled) {
  transform: scale(1.2);
  opacity: 1;
  color: #fbbf24;
}
.nav-arrow:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.page-info {
  font-family: 'Mountains of Christmas', cursive;
  font-size: 1.8rem;
  color: white;
  display: flex;
  align-items: baseline;
  gap: 5px;
  user-select: none;
}
.count {
  color: #fbbf24;
  font-weight: bold;
}
.limit {
  font-size: 1.2rem;
  opacity: 0.7;
}

.custom-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.custom-modal {
  background: #fffbf0;
  border: 4px solid #d42426;
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  width: 90%;
  max-width: 320px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  color: #333;
}
.modal-icon { font-size: 3rem; margin-bottom: 10px; }
.custom-modal h3 { color: #d42426; margin: 0 0 10px 0; }
.custom-modal p { color: #666; font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px; }
.modal-actions { display: flex; gap: 10px; justify-content: center; }

.btn-cancel, .btn-confirm {
  padding: 10px 20px;
  border-radius: 50px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s;
}
.btn-cancel { background: #eee; color: #666; }
.btn-confirm { background: #d42426; color: white; box-shadow: 0 4px 10px rgba(212, 36, 38, 0.3); }
.btn-confirm:hover { transform: scale(1.05); }

.success-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(22, 91, 51, 0.95);
  color: white;
  padding: 15px 30px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  z-index: 200;
  border: 2px solid #fbbf24;
  min-width: 200px;
}
.toast-icon { font-size: 2rem; }
.toast-text h4 { margin: 0; font-size: 1.1rem; color: #fbbf24; }
.toast-text p { margin: 0; font-size: 0.8rem; opacity: 0.9; }

.pop-enter-active, .pop-leave-active { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.8); }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translate(-50%, -30%); }
</style>
