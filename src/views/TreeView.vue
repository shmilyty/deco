<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuth } from '../composables/useAuth.js';
import ChristmasTree from '../components/ChristmasTree.vue';
import TreeSettings from '../components/TreeSettings.vue';

const props = defineProps({
  slug: { type: String, required: true }
});

const { user, fetchMe, getApiBase, getAuthHeaders } = useAuth();
const treeInfo = ref(null);
const notFound = ref(false);
const forbidden = ref(false);
const showSettings = ref(false);
const followLoading = ref(false);

const isOwner = computed(() => {
  return treeInfo.value && user.value && treeInfo.value.isOwner;
});

const isAdmin = computed(() => {
  return user.value && user.value.isAdmin;
});

const isFollowed = computed(() => {
  if (!user.value?.followedTrees) return false;
  return user.value.followedTrees.some(t => t.slug === props.slug);
});

const canFollow = computed(() => {
  return user.value && !isOwner.value;
});

const toggleFollow = async () => {
  if (followLoading.value) return;
  followLoading.value = true;
  try {
    const method = isFollowed.value ? 'DELETE' : 'POST';
    await fetch(`${getApiBase()}/trees/${props.slug}/follow`, {
      method,
      headers: { ...getAuthHeaders() }
    });
    await fetchMe();
  } catch (err) {
    console.error('Toggle follow failed:', err);
  } finally {
    followLoading.value = false;
  }
};

const fetchTreeInfo = async () => {
  try {
    const res = await fetch(`${getApiBase()}/trees/${props.slug}`, {
      headers: { ...getAuthHeaders() }
    });
    if (res.ok) {
      treeInfo.value = await res.json();
    } else if (res.status === 404) {
      notFound.value = true;
    } else if (res.status === 403) {
      forbidden.value = true;
    }
  } catch (err) {
    notFound.value = true;
  }
};

const handleSettingsUpdated = (updatedTree) => {
  if (treeInfo.value) {
    treeInfo.value.title = updatedTree.title;
    treeInfo.value.isPublic = updatedTree.isPublic;
    treeInfo.value.isAccessible = updatedTree.isAccessible;
  }
};

onMounted(fetchTreeInfo);
</script>

<template>
  <div class="tree-view-container">
    <div v-if="notFound" class="error-state">
      <h2>这棵树不存在</h2>
      <router-link to="/explore" class="back-link">返回首页</router-link>
    </div>

    <div v-else-if="forbidden" class="error-state">
      <h2>这棵树不对外开放</h2>
      <p>树的主人设置了访问限制</p>
      <router-link to="/explore" class="back-link">返回首页</router-link>
    </div>

    <template v-else>
      <div class="header-area">
        <router-link to="/explore" class="back-btn" title="所有树">
          ← 所有树
        </router-link>
        <h1>{{ treeInfo?.title || 'Loading...' }}</h1>
        <p v-if="treeInfo" class="owner-info">
          <img v-if="treeInfo.owner?.avatarUrl" :src="treeInfo.owner.avatarUrl" class="owner-avatar" />
          <span>{{ treeInfo.owner?.username }}</span>
          <button
            v-if="canFollow"
            class="follow-btn"
            :class="{ followed: isFollowed }"
            :disabled="followLoading"
            @click="toggleFollow"
          >
            {{ isFollowed ? '★ 已关注' : '☆ 关注' }}
          </button>
        </p>
        <button v-if="isOwner || isAdmin" class="settings-btn" @click="showSettings = true" title="树的设置">
          ⚙️
        </button>
      </div>
      <ChristmasTree :tree-slug="slug" />

      <TreeSettings
        v-if="treeInfo"
        :is-open="showSettings"
        :tree-slug="treeInfo.slug"
        :tree-title="treeInfo.title"
        :tree-is-public="treeInfo.isPublic"
        :tree-is-accessible="treeInfo.isAccessible"
        @close="showSettings = false"
        @updated="handleSettingsUpdated"
      />
    </template>
  </div>
</template>

<style scoped>
.tree-view-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  padding-top: 20px;
  box-sizing: border-box;
}

.header-area {
  position: relative;
  text-align: center;
  flex-shrink: 0;
  z-index: 5;
}

h1 {
  font-family: 'Mountains of Christmas', cursive;
  color: #f9f9f9;
  margin-bottom: 5px;
  text-shadow: 0 4px 6px rgba(139, 0, 0, 0.6);
  font-size: 2.5rem;
}

.owner-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #cbd5e1;
  margin-top: 0;
  font-size: 0.9rem;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.owner-info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.owner-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.follow-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #cbd5e1;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;
}

.follow-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.follow-btn.followed {
  background: rgba(251, 191, 36, 0.2);
  border-color: rgba(251, 191, 36, 0.4);
  color: #fbbf24;
}

.follow-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back-btn {
  position: absolute;
  top: 5px;
  left: -50px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  padding: 4px 12px;
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.3s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
}

.settings-btn {
  position: absolute;
  top: 5px;
  right: -40px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.error-state {
  text-align: center;
  color: white;
  padding: 40px;
}

.error-state h2 {
  font-family: 'Mountains of Christmas', cursive;
  margin-bottom: 15px;
}

.error-state p {
  color: #94a3b8;
  margin-bottom: 20px;
}

.back-link {
  display: inline-block;
  background: #d42426;
  color: white;
  padding: 10px 20px;
  border-radius: 50px;
  text-decoration: none;
  font-weight: bold;
  transition: opacity 0.2s;
}

.back-link:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .tree-view-container {
    justify-content: flex-start;
    padding-top: 90px;
    padding-bottom: 20px;
  }

  h1 {
    font-size: 1.8rem;
    margin: 0 0 5px 0;
  }

  .header-area {
    margin-bottom: 0;
  }

  .back-btn {
    left: -40px;
    font-size: 0.7rem;
    padding: 3px 8px;
  }

  .settings-btn {
    right: -35px;
  }
}
</style>
