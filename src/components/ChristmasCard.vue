<script setup>
import { ref, computed, watch } from 'vue';
const selectedFiles = ref([]); // 存原始文件对象 (用于提交)
const previewUrls = ref([]);   // 存 Blob URL (用于显示)
// 接收父组件传来的参数
const showWarning = ref(false);
const warningMsg = ref("");

// --- 🛠️ 工具函数：触发警告 ---
const triggerWarning = (msg) => {
  warningMsg.value = msg;
  showWarning.value = true;
  
  // 3秒后自动关闭
  setTimeout(() => {
    showWarning.value = false;
  }, 3000);
};
const props = defineProps({
  isOpen: Boolean,        // 弹窗是否打开
  mode: String,           // 'write' (写留言) 或 'read' (读留言)
  data: Object,           //如果是读模式，传入已有的数据 {icon, nickname, content, ...}
  locked: Boolean         // 是否处于“圣诞节前封印状态” (用于读模式)
});
const handleFileChange = (event) => {
  const files = Array.from(event.target.files);
  
  // 检查数量
  if (selectedFiles.value.length + files.length > 3) {
    triggerWarning("包裹太重啦，最多只能放 3 张照片哦 📷");
    return;
  }

  files.forEach(file => {
    // 简单检查类型
    if (!file.type.startsWith('image/')) return;
    
    selectedFiles.value.push(file);
    // 生成预览地址
    previewUrls.value.push(URL.createObjectURL(file));
  });
  
  // 清空 input 也就是让用户可以重复选同一张图（虽然极少见）
  event.target.value = ''; 
};
// 2. 删除某张预览图
const removeImage = (index) => {
  selectedFiles.value.splice(index, 1);
  URL.revokeObjectURL(previewUrls.value[index]); // 释放内存
  previewUrls.value.splice(index, 1);
};
const emit = defineEmits(['close', 'submit']);

// --- 状态管理 ---
// const step = ref('edit'); // 'edit' (填写) | 'preview' (确认预览)
// const selectedIcon = ref('🎁');
const nickname = ref('');
const content = ref('');
const isPrivate = ref(false);
const step = ref('edit'); 
// ⚠️ 注意：这里不再只存 icon 字符串，而是存当前选中图标在数组中的 索引
const currentIndex = ref(0);
// 可选的图标列表
// const icons = [
//   '🎁', // 礼物
//   '⭐️',
//   '🍬', // 糖果
//   '🧦', // 袜子
//   '🧤', // 手套 (New)
//   '🍫', // 巧克力 (New)
//   '🐷',
//   '🍪', // 姜饼人/曲奇 (New)
//   '🔔', // 铃铛
//   '🦌', // 麋鹿
//   '⛄', // 雪人
//   '❄️', //snowflake 
//   '🍻',
//   '💰',
//   '🎊',
//   '💝',
//   '🀄️',
// ];

const icons = [
  // '/icons/gift.png',
  // '/icons/candy.png',
  // '/icons/sock.png',
  // '/icons/bell.png',
  // '/icons/cookie.png'
  '/icons/crystalball.png',
  '/icons/gingerbread.png',
  '/icons/glove.png',
  '/icons/snowflake.png',
  '/icons/gift.png',
  // ... 添加更多
];
const visibleIcons = computed(() => {
  const total = icons.length;
  const result = [];
  
  // 偏移量：从 -2 到 2
  for (let i = -2; i <= 2; i++) {
    // 循环取模算法：保证索引永远在 0 ~ total-1 之间
    // (current + offset + total) % total
    const index = (currentIndex.value + i + total) % total;
    result.push({
      icon: icons[index],
      offset: i, // 记录它是左边第几个还是右边第几个
      realIndex: index
    });
  }
  return result;
});
const nextIcon = () => {
  currentIndex.value = (currentIndex.value + 1) % icons.length;
};
const prevIcon = () => {
  currentIndex.value = (currentIndex.value - 1 + icons.length) % icons.length;
};

// 点击某个图标直接跳到那个图标
const selectIconByOffset = (offset) => {
  // 如果 offset 是 0，说明点的就是中间那个，不做操作
  // 如果 offset 是 1，相当于 nextIcon()
  const total = icons.length;
  currentIndex.value = (currentIndex.value + offset + total) % total;
};

// 重置时（打开弹窗时）
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.mode === 'write') {
    step.value = 'edit';
    currentIndex.value = 0; // 重置到第一个
    nickname.value = '';
    content.value = '';
    isPrivate.value = false;
	selectedFiles.value = [];
    previewUrls.value = [];
  }
});
// 当弹窗打开时，重置状态
// watch(() => props.isOpen, (newVal) => {
//   if (newVal && props.mode === 'write') {
//     step.value = 'edit';
//     selectedIcon.value = '🎁';
//     nickname.value = '';
//     content.value = '';
//     isPrivate.value = false;
//   }
// });

// --- 动作逻辑 ---

// 1. 去预览
const toPreview = () => {
  if (!content.value.trim()) {
    triggerWarning("你的祝福卡片还是空的呢 📝"); // 简单校验
    return;
  }
  step.value = 'preview';
};

// 2. 返回修改
const backToEdit = () => {
  step.value = 'edit';
};

// 提交时 (获取当前选中的图标字符串)
const confirmSubmit = () => {
  emit('submit', {
    icon: icons[currentIndex.value], // 👈 这里改用 computed 取值
    nickname: nickname.value || '神秘人',
    content: content.value,
    isPrivate: isPrivate.value,
    content: content.value,
    images: selectedFiles.value // 👈 传递文件数组
  });
};
// 3. 最终提交
// const confirmSubmit = () => {
//   emit('submit', {
//     icon: selectedIcon.value,
//     nickname: nickname.value || '神秘人',
//     content: content.value,
//     isPrivate: isPrivate.value
//   });
// };
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="overlay" @click.self="$emit('close')">
      <Transition name="slide-down">
        <div v-if="showWarning" class="warning-toast">
          <span class="warning-icon">⚠️</span>
          {{ warningMsg }}
        </div>
      </Transition>
      <div class="card" :class="{ 'locked-shake': mode === 'read' && locked }">
        
        <button class="close-btn" @click="$emit('close')">✕</button>

        <!-- <div v-if="mode === 'write'">
          
          <div v-if="step === 'edit'" class="card-content">
            <h3 class="title">写下祝福 🎄</h3>
            
            <div class="carousel-container">
                <button class="nav-btn left" @click="prevIcon">‹</button>

                <div class="carousel-track">
                    <div 
                    v-for="item in visibleIcons" 
                    :key="item.realIndex + '-' + item.offset"
                    class="carousel-item"
                    :class="{ 
                        'active': item.offset === 0,
                        'side': item.offset !== 0
                    }"
                    :style="{
                        '--offset': item.offset,
                        '--abs-offset': Math.abs(item.offset)
                    }"
                    @click="selectIconByOffset(item.offset)"
                    >
                    {{ item.icon }}
                    </div>
                </div>

                <button class="nav-btn right" @click="nextIcon">›</button>
                </div>

                <div class="selected-hint">
                当前选择
                </div>

            <div class="input-group">
              <input v-model="nickname" type="text" placeholder="你的昵称 (可选)" maxlength="12">
            </div>
            <div class="input-group">
              <textarea v-model="content" placeholder="在这个雪夜，你想说些什么..." rows="4"></textarea>
            </div>

            <label class="toggle-privacy">
              <input type="checkbox" v-model="isPrivate">
              <span class="checkmark"></span>
              <span class="text">悄悄话 (仅对方可见)</span>
            </label>

            <button class="action-btn primary" @click="toPreview">生成预览</button>
          </div>

          <div v-else-if="step === 'preview'" class="card-content preview-mode">
            <h3 class="title">确认挂上去吗？</h3>
            
            <div class="preview-box">
              <div class="preview-icon">{{ icons[currentIndex] }}</div>
              <div class="preview-from">From: {{ nickname || '神秘人' }}</div>
              <div class="preview-body">{{ content }}</div>
              <div v-if="isPrivate" class="private-tag">🔒 私密消息</div>
            </div>

            <p class="warning-text">一旦挂上树梢，就不能取下来了哦</p>

            <div class="button-row">
              <button class="action-btn secondary" @click="backToEdit">返回修改</button>
              <button class="action-btn primary" @click="confirmSubmit">确认挂上</button>
            </div>
          </div>
        </div> -->
	  	<div v-if="mode === 'write'" class="flip-scene">
	  	<div class="flip-wrapper" :class="{ 'is-flipped': step === 'preview' }">
			
			<div class="card-face card-front">
			<h3 class="title">写下祝福 🎄</h3>
			
			<div class="carousel-container">
				<button class="nav-btn left" @click="prevIcon">‹</button>
				<div class="carousel-track">
				<div 
					v-for="item in visibleIcons" 
					:key="item.realIndex + '-' + item.offset"
					class="carousel-item"
					:class="{ 'active': item.offset === 0 }"
					:style="{ '--offset': item.offset, '--abs-offset': Math.abs(item.offset) }"
					@click="selectIconByOffset(item.offset)"
				>
					<img :src="item.icon" alt="icon" class="icon-img" />
				</div>
				</div>
				<button class="nav-btn right" @click="nextIcon">›</button>
			</div>

			<div class="input-group">
				<input v-model="nickname" type="text" placeholder="你的昵称 (可选)" maxlength="12">
			</div>
			<div class="input-group">
				<textarea v-model="content" placeholder="在这个雪夜，你想说些什么..." rows="4"></textarea>
			</div>
			<div class="upload-section">
				<div class="preview-grid">
				<div v-for="(url, index) in previewUrls" :key="index" class="preview-item">
					<img :src="url" />
					<button class="remove-btn" @click="removeImage(index)">×</button>
				</div>
				
				<label v-if="previewUrls.length < 3" class="upload-btn">
					<input type="file" accept="image/*" multiple @change="handleFileChange" hidden>
					<span>📷 添加图片</span>
				</label>
				</div>
				<div class="limit-hint">{{ previewUrls.length }}/3</div>
			</div>
			<label class="toggle-privacy">
				<input type="checkbox" v-model="isPrivate">
				<span class="checkmark"></span>
				<span class="text">悄悄话 (仅对方可见)</span>
			</label>

			<button class="action-btn primary" @click="toPreview">生成预览</button>
			</div>

			<div class="card-face card-back">
			<h3 class="title">确认挂上去吗？</h3>
			
			<div class="preview-box">
				<div class="preview-icon"><img :src="icons[currentIndex]" class="preview-img-lg" /></div>
				<div class="preview-from">From: {{ nickname || '神秘人' }}</div>
				<div class="preview-body">{{ content }}</div>
				<div v-if="previewUrls.length > 0" class="image-gallery">
					<img v-for="(url, idx) in previewUrls" :key="idx" :src="url" class="gallery-img" />
				</div>
				<div v-if="isPrivate" class="private-tag">🔒 私密消息</div>
			</div>

			<p class="warning-text">一旦挂上树梢，就不能取下来了哦</p>

			<div class="button-row">
				<button class="action-btn secondary" @click="backToEdit">返回修改</button>
				<button class="action-btn primary" @click="confirmSubmit">确认挂上</button>
			</div>
			</div>

		</div>
		</div>
        <div v-else class="card-content read-mode">
          <div v-if="locked" class="locked-view">
            <div class="big-icon">🔒</div>
            <h3>封印中</h3>
            <p>From: {{ data?.nickname || '???' }}</p>
            <div class="blur-text">
              这里是由于时间魔法而被隐藏的内容...<br>
              等到圣诞节才可以拆开哦！
            </div>
            <p class="hint">预计解锁时间：12月25日</p>
          </div>

          <div v-else class="unlocked-view">
            <div class="big-icon">
              <img :src="data?.icon" class="preview-img-lg" />
            </div>
            <div class="message-meta">From: {{ data?.nickname }}</div>
            <div class="message-body">
              {{ data?.content }}
            </div>
			
			<div v-if="data?.images && data.images.length > 0" class="image-gallery">
				<img 
					v-for="(path, idx) in data.images" 
					:key="idx" 
					:src="`http://localhost:3000${path}`" 
					class="gallery-img" 
				/>
			</div>
		</div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 基础动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 遮罩层 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px); /* 背景模糊，增加高级感 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: 20px;
}
.carousel-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 80px;
  margin-bottom: 5px;
  perspective: 500px; /* 开启 3D 视差 */
}
.carousel-track {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
}
.carousel-item {
  position: relative;
  font-size: 2.5rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  /* 核心视觉算法：根据 offset 决定位置和大小 */
  /* 中间 offset=0，两边 offset=1或-1 */
  transform: 
    translateX(calc(var(--offset) * 10px)) /* 稍微挤一点，制造重叠感 */
    scale(calc(1 - var(--abs-offset) * 0.2)) /* 越靠边越小 */
    translateZ(calc(var(--abs-offset) * -50px)); /* 越靠边越远 */
    
  opacity: calc(1 - var(--abs-offset) * 0.4); /* 越靠边越透明 */
  z-index: calc(10 - var(--abs-offset)); /* 中间层级最高 */
  
  /* 只有中间那个有背景框 */
  border-radius: 12px;
}

/* 激活状态（中间那个） */
.carousel-item.active {
  background: #fff;
  box-shadow: 0 4px 12px rgba(212, 36, 38, 0.2);
  border: 2px solid #d42426;
  font-size: 3rem; /* 选中时图标更大 */
  z-index: 100;
}

/* 左右箭头按钮 */
.nav-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #d42426;
  cursor: pointer;
  padding: 0 10px;
  z-index: 20;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.nav-btn:hover { opacity: 1; transform: scale(1.2); }

/* 提示文字 */
.selected-hint {
  text-align: center;
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 15px;
  letter-spacing: 2px;
}
/* 卡片主体 */
.card {
  background: #fffbf0; /* 羊皮纸色/暖白 */
  width: 90%;
  max-width: 360px;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  position: relative;
  border: 4px solid #d42426; /* 圣诞红边框 */
  color: #333;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: #fffbf0;
  background-image: linear-gradient(#e8e8e8 1px, transparent 1px);
  background-size: 100% 2rem; /* 模拟信纸横线 */
  background-attachment: local; /* 只有内容区有线 */
}

@keyframes popIn {
  from { transform: scale(0.8) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

/* 顶部关闭按钮 */
.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 5px;
}

.title {
  text-align: center;
  margin-top: 0;
  color: #d42426;
  font-family: 'Georgia', serif;
}

/* 图标选择器 */
.icon-picker 
{
  display: flex;
  gap: 15px;
  padding: 15px 5px; /* 增加左右内边距，防止第一个和最后一个被切掉 */
  margin-bottom: 15px;
  
  /* 核心：横向滚动 + 顺滑滚动 + 触摸优化 */
  overflow-x: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; 
  
  /* 核心：吸附效果 (像轮播图一样一张张切) */
  scroll-snap-type: x mandatory; 
  
  /* 隐藏滚动条但保留功能 */
  scrollbar-width: none; 
  /* ...原有样式... */
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
} 
.icon-picker::-webkit-scrollbar { display: none; } /* Chrome 隐藏滚动条 */

.icon-option {
  font-size: 2.2rem; /* 稍微调大一点 */
  padding: 10px;
  background: #fff;
  border-radius: 16px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  flex-shrink: 0; /* 防止被挤压 */
  
  /* 核心：子元素吸附对齐 */
  scroll-snap-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.icon-option.active {
  border-color: #d42426;
  background: #ffecec;
  transform: scale(1.15) translateY(-2px); /* 选中时稍微浮起 */
  box-shadow: 0 8px 15px rgba(212, 36, 38, 0.2);
}

/* 输入框样式 */
.input-group { margin-bottom: 15px; }
input, textarea {
  width: 100%;
  padding: 8px 0;
  border: none;
  border-bottom: 2px dashed #d42426; /* 红色虚线 */
  background: transparent; /* 透明背景 */
  font-family: 'Nunito', sans-serif;
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  transition: border-color 0.3s;
}
input:focus, textarea:focus {
  outline: none;
  border-bottom: 2px solid #165b33; /* 聚焦变圣诞绿实线 */
}
textarea { resize: none; }

/* 按钮样式 */
.action-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  transition: opacity 0.2s;
  border-radius: 50px; /* 胶囊形状 */
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  letter-spacing: 1px;
  text-transform: uppercase;
}
.action-btn:active {
  transform: translateY(2px);
  box-shadow: none;
}
.primary { background: #d42426; color: white; }
.secondary { background: #eee; color: #666; }
.action-btn:hover { opacity: 0.9; }

.button-row {
  display: flex;
  gap: 10px;
}

/* 预览模式样式 */
.preview-box {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px dashed #ccc;
  text-align: center;
  margin-bottom: 15px;
}
.preview-icon { font-size: 3rem; margin-bottom: 10px; }
.preview-from { color: #888; font-size: 0.9rem; margin-bottom: 8px; }
.preview-body, 
.message-body { 
  font-size: 1.1rem; 
  line-height: 1.6;
  text-align: left; 
  white-space: pre-wrap;
  word-break: break-word;      /* 2. 强力断行：如果一个单词太长，强制切断换行 */
  overflow-wrap: break-word;   /* 3. 标准属性：同上，确保在所有浏览器生效 */
  max-width: 100%;
  color: #2c3e50;
  
  /* 核心：限制高度，超出滚动 */
  max-height: 200px; /* 约等于 6-7 行文字的高度，可根据需要调整 */
  overflow-y: auto;
  padding-right: 5px; /* 防止文字紧贴滚动条 */
  
  /* 视觉优化：给长文加个底纹边框，暗示这里是内容区 */
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 10px;

  display: block;
  width: 100%;
  box-sizing: border-box;
}
/* 美化滚动条 (Webkit browsers: Chrome, Safari) */
.preview-body::-webkit-scrollbar,
.message-body::-webkit-scrollbar {
  width: 6px;
}
.preview-body::-webkit-scrollbar-track,
.message-body::-webkit-scrollbar-track {
  background: transparent;
}
.preview-body::-webkit-scrollbar-thumb,
.message-body::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 10px;
}
.preview-body::-webkit-scrollbar-thumb:hover,
.message-body::-webkit-scrollbar-thumb:hover {
  background-color: #cbd5e1;
}
.warning-text {
  font-size: 0.8rem;
  color: #d42426;
  text-align: center;
  margin-bottom: 15px;
  opacity: 0.8;
}

/* 读模式 - 锁定状态 */
.locked-view { text-align: center; color: #666; }
.big-icon { font-size: 4rem; margin-bottom: 10px; display: block; }
.blur-text {
  filter: blur(4px);
  user-select: none;
  opacity: 0.5;
  margin: 20px 0;
  background: #eee;
}
.hint { font-size: 0.8rem; color: #d42426; }

/* 读模式 - 解锁状态 */
.unlocked-view { text-align: center; }
.message-body { 
  margin-top: 15px; 
  font-size: 1.1rem; 
  line-height: 1.6;
  text-align: left; 
  white-space: pre-wrap;
}

/* 私密复选框 */
.toggle-privacy {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #666;
}
.toggle-privacy input { display: none; }
.checkmark {
  width: 16px; height: 16px;
  border: 2px solid #ccc;
  border-radius: 4px;
  margin-right: 8px;
  display: inline-block;
  position: relative;
}
.toggle-privacy input:checked + .checkmark { background: #d42426; border-color: #d42426; }
/* --- 3D 翻转动画 (Grid 重叠方案 - 推荐) --- */

.flip-scene {
  perspective: 1000px;
}

.flip-wrapper {
  display: grid; /* 关键：用 Grid */
  grid-template-areas: "stack"; /* 定义一个堆叠区域 */
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-style: preserve-3d;
}

.flip-wrapper.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  grid-area: stack; /* 两个面都放在同一个格子里，实现重叠 */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  background: transparent; /* 背景透明，透出 .card 的羊皮纸背景 */
  width: 100%;
}

.card-front {
  transform: rotateY(0deg);
}

.card-back {
  transform: rotateY(180deg);
}

/* 图片上传区 */
.upload-section { margin-bottom: 15px; }
.preview-grid { display: flex; gap: 10px; flex-wrap: wrap; }

.preview-item {
  position: relative;
  width: 60px; height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
}
.preview-item img { width: 100%; height: 100%; object-fit: cover; }
.remove-btn {
  position: absolute; top: 0; right: 0;
  background: rgba(0,0,0,0.6); color: white;
  border: none; width: 20px; height: 20px;
  cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
}

.upload-btn {
  width: 60px; height: 60px;
  border: 2px dashed #d42426;
  border-radius: 8px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: #d42426; font-size: 0.7rem; cursor: pointer;
  background: rgba(212, 36, 38, 0.05);
}
.upload-btn span { margin-top: 4px; font-size: 0.6rem; }
.limit-hint { font-size: 0.7rem; color: #999; text-align: right; margin-top: 4px; }

/* 图片展示画廊 */
.image-gallery {
  display: flex; gap: 8px; margin-top: 10px; overflow-x: auto;
  padding-bottom: 5px;
}
.gallery-img {
  height: 80px; width: auto; /* 固定高度，宽度自适应 */
  border-radius: 6px;
  border: 1px solid #eee;
  flex-shrink: 0;
}
.icon-img {
  width: 40px;
  height: 40px;
  object-fit: contain; /* 保持比例，不拉伸 */
  pointer-events: none; /* 防止拖拽图片 */
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.1)); /* 给图标加点阴影 */
}

/* 2. 预览页/查看页的大图标 */
.preview-img-lg {
  width: 80px;  /* 设置一个合适的大尺寸 */
  height: 80px;
  object-fit: contain;
  margin-bottom: 10px;
  filter: drop-shadow(0 5px 15px rgba(0,0,0,0.2));
}
.warning-toast {
  position: absolute;
  top: 10%; /* 浮在卡片上方一点的位置 */
  left: 50%;
  transform: translateX(-50%);
  
  /* 视觉风格：醒目的橙色，圆润可爱 */
  background: #f97316; 
  color: white;
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: bold;
  font-size: 0.95rem;
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);
  z-index: 200; /* 必须比 .card (默认z-index) 高 */
  
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap; /* 防止文字换行 */
}

.warning-icon {
  font-size: 1.2rem;
}

/* --- 下滑入场动画 --- */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px); /* 从上面一点掉下来 */
}
</style>