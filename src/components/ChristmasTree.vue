<script setup>
import { ref, onMounted } from 'vue'; // 引入 onMounted
import ChristmasCard from './ChristmasCard.vue';

// 定义后端地址 (本地开发时)
const API_URL = 'http://localhost:3000/api/decorations';

const decorations = ref([]); // 初始为空，等待加载
const isChristmas = ref(false); // 状态由后端控制
const isModalOpen = ref(false);
const modalMode = ref('write'); // 'write' | 'read'
const selectedDecoration = ref(null);
const pendingPoint = ref(null);
// --- 1. 获取数据 ---

const fetchDecorations = async () => {
  isLoading.value = true;
  try {
    try {
      const res = await fetch(API_URL);
      const result = await res.json();
      
      decorations.value = result.data;
      isChristmas.value = result.isUnlocked; // 同步后端的时间锁状态
    } catch (err) {
      console.error("加载失败:", err);
    }
  } finally {
    isLoading.value = false; // 无论成功失败都关闭 loading
  }
};
// const fetchDecorations = async () => {
//   try {
//     const res = await fetch(API_URL);
//     const result = await res.json();
    
//     decorations.value = result.data;
//     isChristmas.value = result.isUnlocked; // 同步后端的时间锁状态
//   } catch (err) {
//     console.error("加载失败:", err);
//   }
// };

// 组件挂载时调用
onMounted(() => {
  fetchDecorations();
});

// --- 点击树 (准备挂礼物) ---
const handleTreeClick = (event) => {
  // 如果点到了礼物上，不要触发树的点击（通过事件冒泡阻止，或者这里简单判断）
  if (event.target.closest('.decoration')) return;

  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  pendingPoint.value = { x: x.toFixed(2), y: y.toFixed(2) };
  
  // 打开写模式
  modalMode.value = 'write';
  selectedDecoration.value = null;
  isModalOpen.value = true;
};

// --- 点击礼物 (准备查看) ---
const handleDecorationClick = (item) => {
  modalMode.value = 'read';
  selectedDecoration.value = item;
  isModalOpen.value = true;
};

// --- 接收卡片提交的数据 ---
const handleSubmit = async (formData) => {
  try {
    // ⚠️ 改用 FormData 对象
    const payload = new FormData();
    payload.append('x', pendingPoint.value.x);
    payload.append('y', pendingPoint.value.y);
    payload.append('icon', formData.icon);
    payload.append('nickname', formData.nickname);
    payload.append('content', formData.content);
    payload.append('isPrivate', formData.isPrivate);

    // 循环添加图片
    if (formData.images && formData.images.length) {
      formData.images.forEach(file => {
        payload.append('images', file); // 这里的 'images' 要和后端 multer 配置的名字一致
      });
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      // ⚠️ 注意：使用 FormData 时，不要手动设置 Content-Type header
      // 浏览器会自动设置 multipart/form-data 并加上 boundary
      // headers: { 'Content-Type': 'application/json' },  <-- 删掉这一行
      body: payload
    });

    const result = await res.json();

    if (result.success) {
      // 成功后，重新拉取最新列表，或者手动 push 到本地数组
      await fetchDecorations(); 
      closeModal();
      alert("挂上去啦！🎄");
    } else {
      alert("出错了：" + result.error);
    }
  } catch (err) {
    alert("网络连不上了 QAQ");
  }
};

const closeModal = () => {
  isModalOpen.value = false;
  pendingPoint.value = null;
};
const isLoading = ref(true); // 新增状态


</script>

<template>
  <div class="tree-wrapper">
    <div class="tree-container" @click="handleTreeClick">
      <img src="/tree.png" alt="Christmas Tree" class="tree-img" />
      <div v-if="isLoading" class="loading-text">
        正在从北极运送礼物... 🦌
      </div>
      <div 
        v-for="item in decorations" 
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
/* 这里把之前的样式保留即可 */
.tree-wrapper { display: flex; justify-content: center; align-items: center; min-height: 80vh; padding: 20px; }
.tree-container { position: relative; width: 100%; max-width: 500px; cursor: crosshair; }
.tree-img { width: 100%; height: auto; display: block; user-select: none; }
.decoration { 
  position: absolute; 
  transform: translate(-50%, -50%); 
  /*font-size: 2rem;*/ 
  width: 40px; 
  height: 40px;
  cursor: pointer; 
  transition: transform 0.2s; 
  z-index: 5; 
  transform-origin: top center; /* 以顶部为支点摇摆 */
  animation: swing 3s ease-in-out infinite;
  display: flex;
  justify-content: center;
  align-items: center;
}
/* .decoration:hover { transform: translate(-50%, -50%) scale(1.2); } */
.decoration:hover {
  animation-play-state: paused;
  transform: translate(-50%, -50%) scale(1.3) rotate(0deg);
  z-index: 10;
  filter: drop-shadow(0 0 10px gold); /* 发光效果 */
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
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); /* 让挂件更有立体感 */
}

/* 1. 限制树的最大高度 */
.tree-img {
  width: auto; /* 让宽度自动，保持比例 */
  height: auto;
  
  /* 核心代码：限制高度不超过屏幕的 65%-75% */
  /* 留出 30% 给标题和底部的雪地 */
  max-height: 70vh; 
  
  display: block;
  user-select: none;
  margin: 0 auto; /* 居中 */
}

/* 2. 确保容器也是居中的，且宽度紧贴图片 */
.tree-container {
  position: relative;
  /* 宽度设为 fit-content，这样容器的宽度会收缩到和受限后的图片一样宽 */
  /* 这对保证百分比坐标准确很重要 */
  width: fit-content; 
  margin: 0 auto;
  cursor: crosshair;
}

/* 3. 调整外层 wrapper，去掉多余的 padding */
.tree-wrapper {
  display: flex;
  justify-content: center;
  align-items: center; /* 垂直居中 */
  
  /* 让它占满剩余空间，而不是固定的 min-height */
  height: 100%; 
  padding: 10px; /* 减小 padding */
}
</style>