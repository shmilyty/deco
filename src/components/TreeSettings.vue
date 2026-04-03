<script setup>
import { ref, watch } from 'vue';
import { useAuth } from '../composables/useAuth.js';

const props = defineProps({
  isOpen: Boolean,
  treeSlug: String,
  treeTitle: String,
  treeIsPublic: Boolean,
  treeIsAccessible: Boolean
});

const emit = defineEmits(['close', 'updated']);
const { getApiBase, getAuthHeaders } = useAuth();

const title = ref('');
const isPublic = ref(true);
const isAccessible = ref(true);
const saving = ref(false);

watch(() => props.isOpen, (val) => {
  if (val) {
    title.value = props.treeTitle || '';
    isPublic.value = props.treeIsPublic;
    isAccessible.value = props.treeIsAccessible;
  }
});

// 当公开时，自动开启链接访问
watch(isPublic, (val) => {
  if (val) isAccessible.value = true;
});

const save = async () => {
  saving.value = true;
  try {
    const res = await fetch(`${getApiBase()}/trees/${props.treeSlug}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        title: title.value,
        isPublic: isPublic.value,
        isAccessible: isAccessible.value
      })
    });
    const result = await res.json();
    if (result.success) {
      emit('updated', result.tree);
      emit('close');
    }
  } catch (err) {
    console.error('Save settings failed:', err);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="settings-overlay" @click.self="$emit('close')">
      <div class="settings-card">
        <button class="close-btn" @click="$emit('close')">✕</button>
        <h3>树的设置</h3>

        <div class="field">
          <label>树的名字</label>
          <input v-model="title" type="text" maxlength="50" placeholder="My Christmas Tree" />
        </div>

        <div class="toggle-row">
          <label class="toggle-label">
            <input type="checkbox" v-model="isPublic" />
            <span class="toggle-mark"></span>
            <span>公开展示</span>
          </label>
          <label class="toggle-label">
            <input type="checkbox" v-model="isAccessible" :disabled="isPublic" />
            <span class="toggle-mark"></span>
            <span>允许链接访问</span>
          </label>
        </div>
        <p class="hint toggle-hint">
          {{ isPublic ? '树会出现在首页列表，所有人可访问' : (isAccessible ? '不在列表中，但可通过链接访问' : '仅你自己可见') }}
        </p>

        <button class="save-btn" @click="save" :disabled="saving">
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.settings-overlay {
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

.settings-card {
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
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
}

h3 {
  text-align: center;
  color: #d42426;
  margin: 0 0 20px 0;
  font-family: 'Georgia', serif;
}

.field {
  margin-bottom: 18px;
}

.field > label:not(.toggle-label) {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 6px;
  font-weight: bold;
}

.field input[type="text"] {
  width: 100%;
  padding: 10px;
  border: 2px dashed #d42426;
  border-radius: 8px;
  background: transparent;
  font-size: 1rem;
  color: #2c3e50;
  outline: none;
  box-sizing: border-box;
}

.field input[type="text"]:focus {
  border-color: #165b33;
  border-style: solid;
}

.toggle-row {
  display: flex;
  gap: 20px;
  margin-bottom: 4px;
}

.toggle-hint {
  margin-left: 0 !important;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #333;
}

.toggle-label:has(input:disabled) {
  opacity: 0.4;
  cursor: not-allowed;
}

.toggle-label input {
  display: none;
}

.toggle-mark {
  width: 18px;
  height: 18px;
  border: 2px solid #ccc;
  border-radius: 4px;
  display: inline-block;
  position: relative;
  flex-shrink: 0;
}

.toggle-label input:checked + .toggle-mark {
  background: #d42426;
  border-color: #d42426;
}

.toggle-label input:checked + .toggle-mark::after {
  content: '✓';
  color: white;
  font-size: 12px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.hint {
  font-size: 0.75rem;
  color: #999;
  margin: 4px 0 0 26px;
}

.save-btn {
  width: 100%;
  padding: 12px;
  background: #d42426;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-btn:hover:not(:disabled) {
  opacity: 0.9;
}
</style>
