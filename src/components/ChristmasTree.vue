<script setup>
// import { ref, onMounted } from 'vue'; // 引入 onMounted
import ChristmasCard from './ChristmasCard.vue';
import { ref, onMounted, computed, watch } from 'vue'; // 确保引入了 computed 和 watch
// 定义后端地址 (本地开发时)
const API_URL = 'http://localhost:3000/api/decorations';

const decorations = ref([]); // 初始为空，等待加载
const isChristmas = ref(false); // 状态由后端控制
const isModalOpen = ref(false);
const modalMode = ref('write'); // 'write' | 'read'
const selectedDecoration = ref(null);
const pendingPoint = ref(null);
const showFullModal = ref(false);    // 控制“树满了”弹窗
const showSuccessToast = ref(false); // 控制“成功”提示
// --- 1. 获取数据 ---
// ... existing constants
const PAGE_SIZE = 10; // 🎄 定义每棵树最多挂几个

// ... existing refs (decorations, etc.)
const currentPage = ref(0); // 当前是第几棵树 (从0开始)
const totalTrees = computed(() => {
  if (decorations.value.length === 0) return 1;
  return Math.ceil(decorations.value.length / PAGE_SIZE);
});
const currentTreeDecorations = computed(() => {
  const start = currentPage.value * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  // 截取当前页的数据
  return decorations.value.slice(start, end);
});

// --- 翻页动作 ---
const prevTree = () => {
  if (currentPage.value > 0) currentPage.value--;
};

const nextTree = () => {
  // 如果当前是最后一页，且满了，允许去往（新建）下一页
  if (currentPage.value < totalTrees.value - 1) {
    currentPage.value++;
  } else if (currentTreeDecorations.value.length === PAGE_SIZE) {
    // 最后一页满了，点击下一页相当于“去往新树”
    currentPage.value++;
  }
};
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
// const handleTreeClick = (event) => {
//   // 如果点到了礼物上，不要触发树的点击（通过事件冒泡阻止，或者这里简单判断）
//   if (event.target.closest('.decoration')) return;

//   const rect = event.currentTarget.getBoundingClientRect();
//   const x = ((event.clientX - rect.left) / rect.width) * 100;
//   const y = ((event.clientY - rect.top) / rect.height) * 100;

//   pendingPoint.value = { x: x.toFixed(2), y: y.toFixed(2) };
  
//   // 打开写模式
//   modalMode.value = 'write';
//   selectedDecoration.value = null;
//   isModalOpen.value = true;
// };

const handleTreeClick = (event) => {
  if (event.target.closest('.decoration')) return;

  // 🛑 检查：这棵树是不是满了？
  if (currentTreeDecorations.value.length >= PAGE_SIZE) {
    // 弹窗提醒，或者询问是否去新树
    // const shouldGoNew = confirm("这棵树已经挂满啦！🎄\n要去一棵新树挂礼物吗？");
    // if (shouldGoNew) {
    //   // 跳到最后一页（如果是满的，逻辑上会自动变成新的一页的基础）
    //   // 简单的逻辑：直接跳到最后一页的下一页（如果最后一页没满，就跳到最后一页）
    //   const lastPageIdx = Math.ceil(decorations.value.length / PAGE_SIZE) - 1;
    //   const lastPageCount = decorations.value.length % PAGE_SIZE;
      
    //   if (lastPageCount === 0 && decorations.value.length > 0) {
    //     // 刚好填满，去新的一页
    //     currentPage.value = lastPageIdx + 1;
    //   } else {
    //     // 没填满，去最后一页
    //     currentPage.value = Math.max(0, lastPageIdx);
    //   }
    // }
    showFullModal.value = true;
    return; // 阻止本次点击
  }

  // ... 下面是原有的坐标计算逻辑 ...
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  pendingPoint.value = { x: x.toFixed(2), y: y.toFixed(2) };
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
const handleGoToNewTree = () =>{
  // showFullModal = false
  const lastPageIdx = Math.ceil(decorations.value.length / PAGE_SIZE) - 1;
  const lastPageCount = decorations.value.length % PAGE_SIZE;
  
  if (lastPageCount === 0 && decorations.value.length > 0) {
    // 刚好填满，去新的一页
    currentPage.value = lastPageIdx + 1;
  } else {
    // 没填满，去最后一页
    currentPage.value = Math.max(0, lastPageIdx);
  }
  showFullModal.value=false;
} 
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
      // alert("挂上去啦！🎄");
      const lastPage = Math.ceil(decorations.value.length / PAGE_SIZE) - 1;
      currentPage.value = Math.max(0, lastPage);
      showSuccessToast.value = true;
      setTimeout(() => {
        showSuccessToast.value = false;
      }, 2000); // 3秒后自动消失
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
      <!-- <div 
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
    </div> -->
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
        <!-- <span class="I">🎁</span> -->
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
    <div class="tree-wrapper">
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
.tree-pagination {
  position: absolute;
  bottom: 20px; /* 距离底部 */
  left: 50%;
  transform: translateX(-50%);
  
  display: flex;
  align-items: center;
  gap: 20px;
  
  background: rgba(0, 0, 0, 0.4); /* 半透明黑底 */
  backdrop-filter: blur(4px);
  padding: 10px 20px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 20;
}

/* 箭头按钮 */
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
  color: #fbbf24; /* 悬停变黄色 */
}
.nav-arrow:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

/* 中间的计数文字 */
.page-info {
  font-family: 'Mountains of Christmas', cursive; /* 使用之前的艺术字体 */
  font-size: 1.8rem;
  color: white;
  display: flex;
  align-items: baseline;
  gap: 5px;
  user-select: none;
}

.count {
  color: #fbbf24; /* 当前数量亮黄色 */
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
  backdrop-filter: blur(5px); /* 背景模糊 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

/* --- 1. 确认弹窗样式 --- */
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

/* --- 2. 成功 Toast 样式 --- */
.success-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 居中显示 */
  /* 如果想显示在顶部，可以改用: top: 10%; transform: translateX(-50%); */
  
  background: rgba(22, 91, 51, 0.95); /* 圣诞绿背景 */
  color: white;
  padding: 15px 30px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  z-index: 200;
  border: 2px solid #fbbf24; /* 金边 */
  min-width: 200px;
}

.toast-icon { font-size: 2rem; }
.toast-text h4 { margin: 0; font-size: 1.1rem; color: #fbbf24; }
.toast-text p { margin: 0; font-size: 0.8rem; opacity: 0.9; }

/* --- 动画效果 --- */
/* 弹窗 Pop 进场 */
.pop-enter-active, .pop-leave-active { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.8); }

/* Toast 滑动进场 */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translate(-50%, -30%); } /* 从上方稍微掉下来的感觉 */
</style>