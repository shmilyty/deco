<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const getNextChristmas = () => {
  const now = new Date();
  const thisYear = now.getFullYear();
  const christmas = new Date(thisYear, 11, 25);
  return now >= christmas ? new Date(thisYear + 1, 11, 25).getTime() : christmas.getTime();
};

const TARGET_DATE = getNextChristmas();

const timeLeft = ref(0);
let timer = null;

const updateTime = () => {
  const now = new Date().getTime();
  const diff = TARGET_DATE - now;
  timeLeft.value = Math.max(0, diff);
};

const timeData = computed(() => {
  const diff = timeLeft.value;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const pad = (n) => n.toString().padStart(2, '0');

  return { days, hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };
});

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="countdown-container">
    <div class="glass-box">
      <div class="label-text">Christmas Countdown</div>
      <div class="timer-row">
        <div class="time-block">
          <div class="number-wrapper">
            <Transition name="slide-num" mode="out-in">
              <span :key="timeData.days" class="number">{{ timeData.days }}</span>
            </Transition>
          </div>
          <span class="label">DAYS</span>
        </div>
        <span class="colon">:</span>
        <div class="time-block">
          <div class="number-wrapper">
            <Transition name="slide-num" mode="out-in">
              <span :key="timeData.hours" class="number">{{ timeData.hours }}</span>
            </Transition>
          </div>
          <span class="label">HRS</span>
        </div>
        <span class="colon">:</span>
        <div class="time-block">
          <div class="number-wrapper">
            <Transition name="slide-num" mode="out-in">
              <span :key="timeData.minutes" class="number">{{ timeData.minutes }}</span>
            </Transition>
          </div>
          <span class="label">MIN</span>
        </div>
        <span class="colon">:</span>
        <div class="time-block is-seconds">
          <div class="number-wrapper">
            <Transition name="slide-num" mode="out-in">
              <span :key="timeData.seconds" class="number">{{ timeData.seconds }}</span>
            </Transition>
          </div>
          <span class="label">SEC</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... (保留你原有的样式) ... */
.countdown-container {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 50;
  user-select: none;
  pointer-events: none;
}
.glass-box {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 15px 20px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
  color: white;
  min-width: 200px;
}
.label-text {
  font-family: 'Mountains of Christmas', cursive;
  font-size: 1.2rem;
  margin-bottom: 5px;
  color: #fbbf24;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  letter-spacing: 1px;
}
.timer-row { display: flex; align-items: center; justify-content: center; gap: 5px; }
.time-block { display: flex; flex-direction: column; align-items: center; width: 40px; }
.number-wrapper { height: 36px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.number { font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 1.5rem; line-height: 1; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.label { font-size: 0.6rem; opacity: 0.8; margin-top: 2px; font-weight: bold; letter-spacing: 1px; }
.colon { font-size: 1.5rem; font-weight: bold; margin-bottom: 12px; animation: blink 1s infinite; color: rgba(255,255,255,0.6); }
.is-seconds .number { color: #fbbf24; }
@keyframes blink { 50% { opacity: 0.3; } }
.slide-num-enter-active, .slide-num-leave-active { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.slide-num-enter-from { transform: translateY(100%); opacity: 0; }
.slide-num-leave-to { transform: translateY(-100%); opacity: 0; position: absolute; }

/* 📱 移动端适配 */
@media (max-width: 768px) {
  .countdown-container {
    top: 10px;
    left: 50%;
    transform: translateX(-50%) scale(0.7);
    width: max-content;
  }
  .glass-box {
    padding: 10px 15px;
    background: rgba(0, 0, 0, 0.2);
  }
  .label-text { font-size: 1rem; }
}


</style>