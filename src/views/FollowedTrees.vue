<script setup>
import { computed } from 'vue';
import { useAuth } from '../composables/useAuth.js';

const { user, fetchMe, getApiBase, getAuthHeaders } = useAuth();

const followedTrees = computed(() => user.value?.followedTrees || []);

const unfollow = async (slug) => {
  try {
    const res = await fetch(`${getApiBase()}/trees/${slug}/follow`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    const result = await res.json();
    if (result.success) {
      await fetchMe();
    }
  } catch (err) {
    console.error('Unfollow failed:', err);
  }
};
</script>

<template>
  <div class="followed-container">
    <div class="header-area">
      <router-link to="/explore" class="back-btn">← 返回</router-link>
      <h1>关注的树</h1>
    </div>

    <div class="list-area">
      <div v-if="followedTrees.length === 0" class="empty-state">
        <p>你还没有关注任何树</p>
        <router-link to="/explore" class="go-explore">去逛逛</router-link>
      </div>
      <div v-else class="tree-grid">
        <div v-for="tree in followedTrees" :key="tree.id" class="tree-card">
          <router-link :to="'/' + tree.slug" class="card-link">
            <div class="card-icon">🎄</div>
            <div class="card-body">
              <div class="card-title">{{ tree.title }}</div>
              <div class="card-owner">
                <img v-if="tree.owner?.avatarUrl" :src="tree.owner.avatarUrl" class="avatar" />
                <span>{{ tree.owner?.username }}</span>
              </div>
              <div class="card-count">{{ tree.decorationCount }} 个礼物</div>
            </div>
          </router-link>
          <button class="unfollow-btn" @click="unfollow(tree.slug)" title="取消关注">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.followed-container {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.followed-container::-webkit-scrollbar {
  display: none;
}
</style>

<style scoped>
.followed-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 20px;
  box-sizing: border-box;
}

.header-area {
  position: relative;
  text-align: center;
  flex-shrink: 0;
  margin-bottom: 20px;
  z-index: 5;
}

h1 {
  font-family: 'Mountains of Christmas', cursive;
  color: #f9f9f9;
  margin-bottom: 5px;
  text-shadow: 0 4px 6px rgba(139, 0, 0, 0.6);
  font-size: 2.5rem;
}

.back-btn {
  position: absolute;
  top: 10px;
  left: -80px;
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

.list-area {
  flex: 1;
  width: 100%;
  max-width: 600px;
  padding: 0 20px;
  min-height: 0;
  padding-bottom: 40px;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 60px 0;
}

.empty-state p {
  font-size: 1rem;
  margin-bottom: 20px;
  color: #cbd5e1;
}

.go-explore {
  display: inline-block;
  background: linear-gradient(135deg, #d42426, #a31b1d);
  color: white;
  padding: 10px 24px;
  border-radius: 50px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s;
}

.go-explore:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(212, 36, 38, 0.4);
}

.tree-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  padding-bottom: 20px;
}

.tree-card {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  transition: all 0.3s;
}

.tree-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.card-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  padding-right: 40px;
  text-decoration: none;
  color: white;
}

.card-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-owner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #cbd5e1;
  margin-bottom: 2px;
  min-width: 0;
}

.card-owner span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
}

.card-count {
  font-size: 0.8rem;
  color: #fbbf24;
}

.unfollow-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.unfollow-btn:hover {
  background: rgba(239, 68, 68, 0.8);
  color: white;
  border-color: rgba(239, 68, 68, 0.8);
}

@media (max-width: 768px) {
  .followed-container {
    padding-top: 90px;
  }

  h1 {
    font-size: 1.8rem;
    margin: 0 0 10px 0;
  }

  .back-btn {
    left: -50px;
    font-size: 0.7rem;
    padding: 3px 8px;
  }

  .tree-grid {
    grid-template-columns: 1fr;
  }
}
</style>
