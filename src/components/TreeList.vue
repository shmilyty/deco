<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth.js';

const { getApiBase, getAuthHeaders } = useAuth();
const trees = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fetch(`${getApiBase()}/trees`, {
      headers: { ...getAuthHeaders() }
    });
    const result = await res.json();
    trees.value = result.data || [];
  } catch (err) {
    console.error('Failed to load trees:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="tree-list">
    <h2>All Trees</h2>
    <div v-if="loading" class="loading-state">Loading...</div>
    <div v-else-if="trees.length === 0" class="empty-state">
      <p>还没有人种树呢，快来第一个吧！</p>
    </div>
    <div v-else class="tree-grid">
      <router-link
        v-for="tree in trees"
        :key="tree.id"
        :to="'/' + tree.slug"
        class="tree-card"
      >
        <div class="card-icon">🎄</div>
        <div class="card-body">
          <div class="card-title">{{ tree.title }}</div>
          <div class="card-owner">
            <img v-if="tree.owner.avatarUrl" :src="tree.owner.avatarUrl" class="avatar" />
            <span>{{ tree.owner.username }}</span>
          </div>
          <div class="card-count">{{ tree.decorationCount }} 个礼物</div>
        </div>
        <div v-if="!tree.isPublic" class="private-badge">非公开</div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.tree-list {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.tree-list h2 {
  color: white;
  text-align: center;
  margin-bottom: 20px;
  font-family: 'Mountains of Christmas', cursive;
}

.loading-state,
.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 40px 0;
}

.tree-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  padding-bottom: 20px;
}

.tree-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 15px;
  text-decoration: none;
  color: white;
  transition: all 0.3s;
}

.tree-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
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

.private-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(239, 68, 68, 0.8);
  color: white;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .tree-grid {
    grid-template-columns: 1fr;
  }
}
</style>
