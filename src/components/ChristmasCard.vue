<script setup>
import { ref, computed, watch, onUnmounted, onMounted, nextTick } from 'vue';

// 1. Props & Emits
const props = defineProps({
  isOpen: Boolean,
  mode: String,
  data: Object,
  locked: Boolean
});
const emit = defineEmits(['close', 'submit']);
const toastType = ref('warning');
// 2. 状态定义
const step = ref('edit');
const currentIndex = ref(0);
const nickname = ref('');
const content = ref('');
const isPrivate = ref(false);
const isEasterEgg = ref(false);
const selectedFiles = ref([]);
const previewUrls = ref([]);
const showWarning = ref(false);
const warningMsg = ref("");
const isVerified = ref(false);

// 验证码相关状态
const turnstileToken = ref('');
const turnstileWidgetId = ref(null); // 用来记录渲染后的 ID，方便清除

// 3. 常量定义
const EASTER_EGG_ICON = '/tree/icons/secret.png';
const icons = [
  '/tree/icons/crystalball.png',
  '/tree/icons/gingerbread.png',
  '/tree/icons/glove.png',
  '/tree/icons/snowflake.png',
  '/tree/icons/gift.png',
  '/tree/icons/ribbon.png',
  '/tree/icons/ball.png',
  '/tree/icons/mistletoe.png',
  '/tree/icons/cupcake.png'
];
const imgBaseUrl = import.meta.env.PROD ? '/tree' : 'http://localhost:3000';
const showToast = (msg, type = 'warning') => {
  warningMsg.value = msg;
  toastType.value = type; // 记录类型
  showWarning.value = true;
  setTimeout(() => { showWarning.value = false; }, 3000);
};
// 4. 计算属性
const visibleIcons = computed(() => {
  const total = icons.length;
  const result = [];
  for (let i = -2; i <= 2; i++) {
    const index = (currentIndex.value + i + total) % total;
    let iconPath = icons[index];
    if (i === 0 && isEasterEgg.value) {
      iconPath = EASTER_EGG_ICON;
    }
    result.push({ icon: iconPath, offset: i, realIndex: index });
  }
  return result;
});

// 5. 方法定义
const triggerWarning = (msg) => showToast(msg, 'warning');

// --- 🤖 验证码渲染核心函数 ---
const renderTurnstile = () => {
  // 1. 检查环境：Turnstile 库是否加载？元素是否存在？
  if (!window.turnstile || !document.getElementById('cf-turnstile')) {
    return; // 还没准备好，先不管
  }

  // 2. 清理旧的（防止重复渲染报错）
  if (turnstileWidgetId.value) {
    try {
      window.turnstile.remove(turnstileWidgetId.value);
    } catch(e) { /* 忽略清理错误 */ }
    turnstileWidgetId.value = null;
  }

  // 3. 开始渲染
  try {
    turnstileWidgetId.value = window.turnstile.render('#cf-turnstile', {
      sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACHbbnubC4T8Eic-',
      callback: function(token) {
        turnstileToken.value = token;
        setTimeout(() => {
          isVerified.value = true;
          showToast("✅ 人机验证通过！", "success"); // 👈 触发绿色弹窗
        }, 1000);
      },
      'expired-callback': function() {
        turnstileToken.value = '';
        isVerified.value = false; // ✨ 过期了要重新显示
      }
    });
  } catch (e) {
    console.log("Turnstile渲染跳过:", e);
  }
};

const tryTriggerEasterEgg = () => {
  isEasterEgg.value = false;
  if (Math.random() < 0.02) {
    isEasterEgg.value = true;
    console.log("🎉 彩蛋触发！");
  }
};

const nextIcon = () => { currentIndex.value = (currentIndex.value + 1) % icons.length; tryTriggerEasterEgg(); };
const prevIcon = () => { currentIndex.value = (currentIndex.value - 1 + icons.length) % icons.length; tryTriggerEasterEgg(); };
const selectIconByOffset = (offset) => { 
  if (offset === 0) return; 
  const total = icons.length; 
  currentIndex.value = (currentIndex.value + offset + total) % total; 
  tryTriggerEasterEgg(); 
};

const handleFileChange = (event) => {
  const files = Array.from(event.target.files);
  if (selectedFiles.value.length + files.length > 3) {
    triggerWarning("包裹太重啦，最多只能放 3 张照片哦 📷");
    return;
  }
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    selectedFiles.value.push(file);
    previewUrls.value.push(URL.createObjectURL(file));
  });
  event.target.value = ''; 
};

const removeImage = (index) => {
  selectedFiles.value.splice(index, 1);
  URL.revokeObjectURL(previewUrls.value[index]);
  previewUrls.value.splice(index, 1);
};

const isDev = !import.meta.env.PROD;

const toPreview = () => {
  if (!content.value.trim()) {
    triggerWarning("你的祝福卡片还是空的呢 📝");
    return;
  }
  // 检查验证码 (dev 模式跳过)
  if (!isDev && !turnstileToken.value) {
    triggerWarning("请先完成人机验证 🤖");
    return;
  }
  step.value = 'preview';
};

const backToEdit = () => { step.value = 'edit'; };

const confirmSubmit = () => {
  const finalIcon = isEasterEgg.value ? EASTER_EGG_ICON : icons[currentIndex.value];
  emit('submit', {
    icon: finalIcon,
    nickname: nickname.value || '神秘人',
    content: content.value,
    isPrivate: isPrivate.value,
    images: selectedFiles.value,
    token: turnstileToken.value // 提交 Token
  });
};

// 6. 生命周期与监听
onMounted(() => {
  // 加载 Cloudflare 脚本
  if (!document.getElementById('turnstile-script')) {
    const script = document.createElement('script');
    script.id = 'turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => {
      // 脚本加载完，如果卡片此时正开着，尝试渲染
      if (props.isOpen && props.mode === 'write') {
        renderTurnstile();
      }
    };
    document.head.appendChild(script);
  }
});

// ⚠️ 关键修复：监听 isOpen 变化
watch(() => props.isOpen, async (val) => {
  if (val) {
    // 1. 样式处理
    document.body.classList.add('reading-mode');
    
    // 2. 如果是写信模式，初始化数据并渲染验证码
    if (props.mode === 'write') {
      step.value = 'edit';
      currentIndex.value = 0;
      isEasterEgg.value = false;
      nickname.value = '';
      content.value = '';
      isPrivate.value = false;
      selectedFiles.value = [];
      previewUrls.value = [];
      turnstileToken.value = '';
      isVerified.value = false;
      // ⚠️ 重点：等待 DOM 更新 (nextTick)，确保 div 出来了再渲染
      await nextTick();
      renderTurnstile();
    }
  } else {
    document.body.classList.remove('reading-mode');
  }
});

onUnmounted(() => {
  document.body.classList.remove('reading-mode');
  previewUrls.value.forEach(url => URL.revokeObjectURL(url));
});
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="overlay" @click.self="$emit('close')">
      
      <Transition name="slide-down">
        <div v-if="showWarning" class="warning-toast" :class="toastType">
          <span class="warning-icon">{{ toastType === 'success' ? '' : '' }}</span>
          {{ warningMsg }}
        </div>
      </Transition>

      <div class="card" :class="{ 'locked-shake': mode === 'read' && locked }">
        <button class="close-btn" @click="$emit('close')">✕</button>

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
                    :class="{ 
                      'active': item.offset === 0,
                      'side': item.offset !== 0,
                      'is-egg': item.offset === 0 && isEasterEgg  
                    }"
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
              <div class="captcha-wrapper" v-if="!isVerified && !isDev">
                <div id="cf-turnstile"></div>
              </div>
              <div v-if="isDev" class="dev-badge">DEV MODE - Turnstile skipped</div>
              <button class="action-btn primary" @click="toPreview">生成预览</button>
            </div>

            <div class="card-face card-back">
              <h3 class="title">确认挂上去吗？</h3>
              <div class="preview-box">
                <div class="preview-icon"><img :src="isEasterEgg ? EASTER_EGG_ICON : icons[currentIndex]" class="preview-img-lg" /></div>
                <div class="preview-from">
                  <div class="from-label">From.</div>
                  <div class="from-name">{{ nickname || '神秘人' }}</div>
                </div>
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
              这里是由于时间魔法而被隐藏的内容...<br>等到圣诞节才可以拆开哦！
            </div>
            <p class="hint">预计解锁时间：12月25日</p>
          </div>
          <div v-else class="unlocked-view">
            <div class="big-icon"><img :src="data?.icon" class="preview-img-lg" /></div>
            <div class="message-meta">
              <div class="from-label">From.</div>
              <div class="from-name">{{ data?.nickname }}</div>
            </div>
            <div class="message-body">{{ data?.content }}</div>
            <div v-if="data?.images && data.images.length > 0" class="image-gallery">
              <img v-for="(path, idx) in data.images" :key="idx" :src="`/tree${path}`" class="gallery-img" />
            </div>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* =========================================
   1. 全局配置与字体
   ========================================= */
/* CSS 变量直接内联到各选择器中（scoped 样式中 :root 变量无法生效） */

/* 基础动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* =========================================
   2. 遮罩层 (Flex布局，居中且防溢出)
   ========================================= */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  /* 适配刘海屏 */
  padding: env(safe-area-inset-top) 20px env(safe-area-inset-bottom) 20px;
  
  display: flex;
  justify-content: center;
  align-items: center;
}

/* =========================================
   3. 卡片主体 (核心适配逻辑)
   ========================================= */
.card {
  box-sizing: border-box;
  
  /* ⚠️ 宽度适配：小屏占92%，大屏最大380px */
  width: min(92vw, 380px);
  
  /* ⚠️ 高度适配：最高占屏幕85%，防止被键盘/地址栏顶飞 */
  max-height: 85dvh; 
  height: auto;
  
  /* 布局 */
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 0 auto;
  
  /* 外观还原：红框 + 羊皮纸背景 */
  border: 4px solid #d42426;
  border-radius: 16px;
  background: #fffbf0;
  background-image: linear-gradient(#e8e8e8 1px, transparent 1px); /* 信纸横线 */
  background-size: 100% 2rem; /* 行高 */
  background-attachment: local; /* 线条跟随内容滚动 */
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  
  /* 进场动画 */
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from { transform: scale(0.9) translateY(10px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

/* 关闭按钮 */
.close-btn { 
  position: absolute; top: 10px; right: 10px; 
  background: transparent; /* 透明背景 */
  border: none; font-size: 1.8rem; color: #999; 
  cursor: pointer; padding: 5px; z-index: 50; 
  line-height: 1;
}

/* =========================================
   4. 翻转容器 (Scene)
   ========================================= */
.flip-scene { 
  perspective: 1000px; 
  width: 100%; 
  flex: 1; /* 撑满卡片剩余高度 */
  min-height: 0; /* 修复Flex子元素溢出问题 */
  position: relative;
}

.flip-wrapper { 
  display: grid; 
  grid-template-areas: "stack"; 
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
  transform-style: preserve-3d; 
  width: 100%;
  height: 100%;
}
.flip-wrapper.is-flipped { transform: rotateY(180deg); }

/* =========================================
   5. 卡片正反面 (内容层)
   ========================================= */
.card-face {
  grid-area: stack;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  background: transparent;
  width: 100%;
  height: 100%;
  
  /* ⚠️ 关键：这里控制内边距，保证分割线不贴边 */
  padding: 24px; 
  box-sizing: border-box;
  
  /* 内部滚动：防止内容太长被切掉 */
  overflow-y: auto; 
  overflow-x: hidden;
}
.card-front { transform: rotateY(0deg); }
.card-back { transform: rotateY(180deg); }

.title { 
  text-align: center; margin-top: 5px; margin-bottom: 20px;
  color: #d42426; font-family: 'Georgia', serif; 
}

/* =========================================
   6. 轮播图区域 (还原透明背景)
   ========================================= */
.carousel-container { 
  display: flex; align-items: center; justify-content: center; 
  position: relative; height: 70px; margin-bottom: 20px; perspective: 500px; 
  width: 100%;
}
.carousel-track { width: 100%; position: relative; display: flex; justify-content: center; align-items: center; }

.carousel-item {
  position: relative; width: 50px; height: 50px; 
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  user-select: none; transition: all 0.3s;
  
  /* 3D 变换 */
  transform: translateX(calc(var(--offset) * 10px)) scale(calc(1 - var(--abs-offset) * 0.2)) translateZ(calc(var(--abs-offset) * -50px));
  opacity: calc(1 - var(--abs-offset) * 0.4); 
  z-index: calc(10 - var(--abs-offset)); 
  
  /* 默认背景透明，只有选中的才有白底 */
  background: transparent;
  border-radius: 12px;
}

.carousel-item.active { 
  background: #fff; 
  box-shadow: 0 4px 12px rgba(212, 36, 38, 0.2); 
  border: 2px solid #d42426;
  width: 60px; height: 60px; 
  z-index: 100; 
}

.icon-img { width: 100%; height: 100%; object-fit: contain; padding: 5px; pointer-events: none; }

/* 左右箭头：透明背景，红色图标 */
.nav-btn { 
  background: transparent; 
  border: none; font-size: 1.5rem; color: #d42426; opacity: 0.6;
  cursor: pointer; padding: 0 10px; z-index: 20; 
}
.nav-btn:hover { opacity: 1; transform: scale(1.1); }

/* =========================================
   7. 输入框 (还原虚线分割线)
   ========================================= */
.input-group { margin-bottom: 20px; width: 100%; }

input, textarea { 
  width: 100%; 
  padding: 10px 0; 
  border: none; 
  /* 还原红色虚线 */
  border-bottom: 2px dashed #d42426; 
  background: transparent; /* 透明背景 */
  font-family: 'Nunito', sans-serif; 
  font-size: 1.1rem; color: #2c3e50; 
  margin-bottom: 0.5rem; 
  border-radius: 0; /* 移除默认圆角 */
  outline: none;
}
input::placeholder, textarea::placeholder { color: #999; }
input:focus, textarea:focus { outline: none; border-bottom: 2px solid #165b33; }
textarea { resize: none; }

/* =========================================
   8. 图片上传区 (还原方框样式)
   ========================================= */
.upload-section { margin-bottom: 20px; width: 100%; }
.preview-grid { display: flex; gap: 10px; flex-wrap: wrap; }

/* 预览的小图 */
.preview-item { position: relative; width: 60px; height: 60px; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; background: #fff; }
.preview-item img { width: 100%; height: 100%; object-fit: cover; }
.remove-btn { position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.6); color: white; border: none; width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; }

/* 上传按钮：还原红虚线框 + 淡红背景 */
.upload-btn { 
  width: 60px; height: 60px; 
  border: 2px dashed #d42426; /* 红虚线 */
  border-radius: 8px; 
  background: rgba(212, 36, 38, 0.05); /* 淡红背景 */
  color: #d42426; 
  display: flex; flex-direction: column; align-items: center; justify-content: center; 
  cursor: pointer; 
  box-sizing: border-box;
}
.upload-btn span { margin-top: 4px; font-size: 0.6rem; transform: scale(0.9); }
.limit-hint { font-size: 0.7rem; color: #999; text-align: right; margin-top: 4px; }

/* =========================================
   9. 预览页面 (白卡片还原)
   ========================================= */
.preview-box { 
  box-sizing: border-box; 
  width: 100%; 
  background: white; 
  padding: 15px; 
  border-radius: 8px; 
  border: 1px dashed #ccc; 
  text-align: center; 
  margin-bottom: 10px; 
  
  /* ⚠️ 核心修复 1: 启用 Flex 列布局 */
  display: flex;
  flex-direction: column;
  
  /* ⚠️ 核心修复 2: 限制白框的最大高度 */
  /* 防止白框太高把上面的标题或下面的按钮挤出屏幕 */
  /* 55vh 意味着白框最多占屏幕高度的 55% */
  max-height: 55vh; 
  
  position: relative;
}

.preview-icon { font-size: 3rem; margin-bottom: 10px; flex-shrink: 0;}
.preview-img-lg {flex-shrink: 0; width: 70px; height: 70px; object-fit: contain; margin-bottom: 8px; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.2)); }

.preview-from, .message-meta { 
  text-align: left; color: #165b33; font-family: 'Courgette', 'Ma Shan Zheng', cursive; 
  margin-bottom: 8px; line-height: 1.2; width: 100%;flex-shrink: 0; 
}
.from-label { font-size: 1rem; font-weight: 800; opacity: 0.8; }
.from-name { font-size: 1.5rem; font-weight: 900; margin-left: 5px; letter-spacing: 1px; }

.preview-body, .message-body { 
  box-sizing: border-box; 
  width: 100%;
  font-size: 1.2rem; 
  line-height: 1.5; 
  text-align: left; 
  white-space: pre-wrap; 
  word-break: break-word; 
  color: #2c3e50; 
  
  /* ⚠️ 核心修复 3: 弹性高度 */
  /* flex: 1 让文字区域自动占据剩余空间 */
  /* min-height: 0 是 Flexbox 滚动条生效的关键 */
  flex: 1; 
  min-height: 0; 
  overflow-y: auto; /* 文字多了就出滚动条 */
  
  /* 移除固定的 max-height，改由父容器控制 */
  /* max-height: 150px; <--- 删除这行 */
  
  background: rgba(255, 255, 255, 0.5); 
  border-radius: 8px; 
  padding: 10px; 
  font-family: 'Courgette', 'Ma Shan Zheng', cursive; 
  border: 1px solid rgba(0,0,0,0.05); 
  margin-bottom: 5px;
}

/* =========================================
   10. 底部按钮与隐私 (布局)
   ========================================= */
.toggle-privacy { display: flex; align-items: center; margin-bottom: 20px; cursor: pointer; font-size: 0.9rem; color: #666; }
.toggle-privacy input { display: none; }
.checkmark { width: 16px; height: 16px; border: 2px solid #ccc; border-radius: 4px; margin-right: 8px; display: inline-block; position: relative; }
.toggle-privacy input:checked + .checkmark { background: #d42426; border-color: #d42426; }

.button-row { display: flex; gap: 10px; width: 100%; margin-top: auto; }
.action-btn { 
  flex: 1; padding: 12px; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; font-size: 1rem; 
  transition: opacity 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); letter-spacing: 1px; 
  white-space: nowrap;
}
.action-btn:active { transform: translateY(2px); box-shadow: none; }
.primary { background: #d42426; color: white; }
.secondary { background: #eee; color: #666; }

/* =========================================
   11. 其他组件 (提示/锁定)
   ========================================= */

.locked-view { text-align: center; color: #666; width: 100%; }
.big-icon { font-size: 3.5rem; margin-bottom: 10px; display: block; }
.blur-text { filter: blur(4px); opacity: 0.5; margin: 15px 0; background: #eee; padding: 10px; }
.unlocked-view { text-align: center; width: 100%; }
.image-gallery { 
  display: flex; 
  gap: 8px; 
  margin-top: 5px; 
  overflow-x: auto; 
  padding-bottom: 5px; 
  width: 100%; 
  
  /* ⚠️ 核心修复 4: 防止图片被压缩没了 */
  flex-shrink: 0; 
  
  /* 可选：限制图片区域最大高度，防止图片太大 */
  max-height: 50px;
}
.gallery-img { height: 45px; width: auto; border-radius: 6px; border: 1px solid #eee; flex-shrink: 0; }

/* 📱 窄屏微调 (针对 iPhone SE 等超小屏) */
@media (max-width: 380px) {
  .card-face { padding: 16px; }
  .card { border-width: 3px; }
  .title { margin-bottom: 10px; font-size: 1.4rem; }
  .preview-box { padding: 15px; margin-bottom: 10px; }
}
/*
12. 彩蛋
*/
.carousel-item.active.is-egg img { filter: drop-shadow(0 0 15px gold); animation: egg-shake 0.5s ease-in-out infinite; }
@keyframes egg-shake {
  0%, 100% { transform: rotate(0deg) scale(1); } 25% { transform: rotate(-10deg) scale(1.1); } 75% { transform: rotate(10deg) scale(1.1); }
}
.warning-toast { 
  position: absolute; top: 10px; left: 50%; transform: translateX(-50%); 
  padding: 8px 20px; border-radius: 30px; font-size: 0.9rem; z-index: 200; 
  display: flex; gap: 6px; white-space: nowrap; 
  box-shadow: 0 4px 10px rgba(0,0,0,0.2); 
  transition: all 0.3s; /* 增加过渡 */
}

/* 🟠 警告皮肤 (默认) */
.warning-toast.warning {
  background: #f97316; /* 橙色 */
  color: white;
}

/* 🟢 成功皮肤 (新增) */
.warning-toast.success {
  background: #165b33; /* 圣诞绿 */
  color: white;
  border: 1px solid #1f7a44;
}

/* 验证码容器调整 */
.captcha-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  /* margin-bottom: 15px; */ /* 可以去掉这个，让消失更彻底 */
  width: 100%;
  min-height: 0; /* 允许高度塌陷 */
}
/* 给验证码容器加一点 margin，仅当它显示时生效 */
.captcha-wrapper:not(:empty) {
   margin-bottom: 15px;
}

.dev-badge {
  text-align: center;
  font-size: 0.7rem;
  color: #999;
  background: #f0f0f0;
  padding: 4px 10px;
  border-radius: 8px;
  margin-bottom: 10px;
}
</style>