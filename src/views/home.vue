<template>
  <div class="welcome">
    <HeaderBar :devices="devices" @search="handleSearch" @search-reset="handleSearchReset" />
    <el-main class="home-main">
      <section class="hero-panel mecha-grid">
        <div class="hero-copy">
          <p class="hero-eyebrow">Mission Console</p>
          <h1 class="hero-title">
            {{ $t('home.greeting') }}
            <span>{{ $t('home.wish') }}</span>
          </h1>
          <p class="hero-hint">Let's have a wonderful day.</p>
          <div class="hero-actions">
            <button class="hero-primary-btn mecha-pulse" type="button" @click="showAddDialog">
              <span>{{ $t('home.addAgent') }}</span>
              <i class="el-icon-right"></i>
            </button>
            <button class="hero-secondary-btn" type="button" @click="refreshAgents">
              <i class="el-icon-refresh"></i>
              <span>Sync</span>
            </button>
          </div>
        </div>

        <div class="hero-stats">
          <article class="stat-pill">
            <span class="stat-value">{{ devices.length }}</span>
            <span class="stat-label">Agents</span>
          </article>
          <article class="stat-pill">
            <span class="stat-value">{{ onlineDeviceCount }}</span>
            <span class="stat-label">Online(24h)</span>
          </article>
          <article class="stat-pill">
            <span class="stat-value">{{ featureEnabledCount }}</span>
            <span class="stat-label">Features</span>
          </article>
        </div>
      </section>

      <div v-if="isLoading" class="device-list-container">
        <div v-for="i in skeletonCount" :key="'skeleton-' + i" class="skeleton-item">
          <div class="skeleton-image"></div>
          <div class="skeleton-content">
            <div class="skeleton-line"></div>
            <div class="skeleton-line-short"></div>
          </div>
        </div>
      </div>

      <transition-group v-else-if="devices.length > 0" name="card-rise" tag="div" class="device-list-container">
        <DeviceItem
          v-for="item in devices"
          :key="item.agentId || item.id"
          :device="item"
          :feature-status="featureStatus"
          @configure="goToRoleConfig"
          @deviceManage="handleDeviceManage"
          @delete="handleDeleteAgent"
          @chat-history="handleShowChatHistory"
        />
      </transition-group>

      <div v-else class="empty-state">
        <i class="el-icon-data-analysis"></i>
        <p>No agent found.</p>
        <button type="button" class="hero-secondary-btn" @click="fetchAgentList">
          <i class="el-icon-refresh"></i>
          <span>Reload</span>
        </button>
      </div>

      <AddWisdomBodyDialog :visible.sync="addDeviceDialogVisible" @confirm="handleWisdomBodyAdded" />
    </el-main>
    <el-footer>
      <version-footer />
    </el-footer>
    <chat-history-dialog
      :visible.sync="showChatHistory"
      :agent-id="currentAgentId"
      :agent-name="currentAgentName"
    />
  </div>
</template>

<script>
import Api from '@/apis/api';
import AddWisdomBodyDialog from '@/components/AddWisdomBodyDialog.vue';
import ChatHistoryDialog from '@/components/ChatHistoryDialog.vue';
import DeviceItem from '@/components/DeviceItem.vue';
import HeaderBar from '@/components/HeaderBar.vue';
import VersionFooter from '@/components/VersionFooter.vue';
import featureManager from '@/utils/featureManager';

export default {
  name: 'HomePage',
  components: { DeviceItem, AddWisdomBodyDialog, HeaderBar, VersionFooter, ChatHistoryDialog },
  data() {
    return {
      addDeviceDialogVisible: false,
      devices: [],
      originalDevices: [],
      isSearching: false,
      searchRegex: null,
      isLoading: true,
      skeletonCount: Number(localStorage.getItem('skeletonCount')) || 8,
      showChatHistory: false,
      currentAgentId: '',
      currentAgentName: '',
      featureStatus: {
        voiceprintRecognition: false,
        voiceClone: false,
        knowledgeBase: false
      }
    };
  },
  computed: {
    onlineDeviceCount() {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      return this.devices.filter((item) => {
        if (!item.lastConnectedAt) {
          return false;
        }

        const timestamp = new Date(item.lastConnectedAt).getTime();
        return Number.isFinite(timestamp) && now - timestamp <= oneDay;
      }).length;
    },
    featureEnabledCount() {
      return Object.values(this.featureStatus).filter(Boolean).length;
    }
  },
  async mounted() {
    this.fetchAgentList();
    await this.loadFeatureStatus();
  },

  methods: {
    async loadFeatureStatus() {
      await featureManager.waitForInitialization();
      const config = featureManager.getConfig();
      this.featureStatus = {
        voiceprintRecognition: config.voiceprintRecognition,
        voiceClone: config.voiceClone,
        knowledgeBase: config.knowledgeBase
      };
    },
    showAddDialog() {
      this.addDeviceDialogVisible = true;
    },
    refreshAgents() {
      this.fetchAgentList();
    },
    goToRoleConfig() {
      this.$router.push('/role-config');
    },
    handleWisdomBodyAdded() {
      this.fetchAgentList();
      this.addDeviceDialogVisible = false;
    },
    handleDeviceManage() {
      this.$router.push('/device-management');
    },
    handleSearch(keyword) {
      this.isSearching = true;
      this.isLoading = true;
      const isMac = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(keyword);
      const searchType = isMac ? 'mac' : 'name';

      Api.agent.searchAgent(
        keyword,
        searchType,
        ({ data }) => {
          if (data?.data) {
            this.devices = data.data.map((item) => ({
              ...item,
              agentId: item.id
            }));
          }
          this.isLoading = false;
        },
        (error) => {
          console.error('Search agent failed:', error);
          this.isLoading = false;
          this.$message.error(this.$t('message.searchFailed'));
        }
      );
    },
    handleSearchReset() {
      this.isSearching = false;
      this.devices = [...this.originalDevices];
    },
    fetchAgentList() {
      this.isLoading = true;
      Api.agent.getAgentList(
        ({ data }) => {
          if (data?.data) {
            this.originalDevices = data.data.map((item) => ({
              ...item,
              agentId: item.id
            }));

            this.skeletonCount = Math.min(Math.max(this.originalDevices.length, 3), 10);
            this.handleSearchReset();
          }
          this.isLoading = false;
        },
        (error) => {
          console.error('Failed to fetch agent list:', error);
          this.isLoading = false;
        }
      );
    },
    handleDeleteAgent(agentId) {
      this.$confirm(this.$t('home.confirmDeleteAgent'), '提示', {
        confirmButtonText: this.$t('button.ok'),
        cancelButtonText: this.$t('button.cancel'),
        type: 'warning'
      })
        .then(() => {
          Api.agent.deleteAgent(agentId, (res) => {
            if (res.data.code === 0) {
              this.$message.success({
                message: this.$t('home.deleteSuccess'),
                showClose: true
              });
              this.fetchAgentList();
            } else {
              this.$message.error({
                message: res.data.msg || this.$t('home.deleteFailed'),
                showClose: true
              });
            }
          });
        })
        .catch(() => {});
    },
    handleShowChatHistory({ agentId, agentName }) {
      this.currentAgentId = agentId;
      this.currentAgentName = agentName;
      this.showChatHistory = true;
    }
  }
};
</script>

<style scoped>
.welcome {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.home-main {
  width: min(1600px, 100%);
  margin: 0 auto;
  padding: 20px clamp(12px, 2.8vw, 34px) 10px !important;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(220px, 0.8fr);
  gap: 20px;
  padding: 24px;
  border-radius: var(--mecha-radius-lg);
  border: 1px solid rgb(255 255 255 / 0.16);
  background:
    linear-gradient(155deg, rgb(255 255 255 / 0.08), transparent 34%),
    linear-gradient(120deg, rgb(15 27 44 / 0.92), rgb(11 20 31 / 0.92));
  overflow: hidden;
  box-shadow: 0 20px 48px rgb(0 0 0 / 0.32);
}

.hero-panel::after {
  content: '';
  position: absolute;
  width: 360px;
  height: 360px;
  right: -120px;
  top: -180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(40 216 255 / 0.24), transparent 70%);
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.hero-eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-family: var(--mecha-font-display);
  color: var(--mecha-accent-cool);
}

.hero-title {
  margin: 10px 0 0;
  font-family: var(--mecha-font-display);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: clamp(22px, 2.7vw, 36px);
  color: #f2fbff;
}

.hero-title span {
  display: block;
  margin-top: 6px;
  color: rgb(242 251 255 / 0.88);
}

.hero-hint {
  margin: 10px 0 0;
  color: var(--mecha-text-muted);
  font-size: 13px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.hero-primary-btn,
.hero-secondary-btn {
  border: 0;
  height: 38px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  font-family: var(--mecha-font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    transform var(--mecha-motion-fast) ease,
    box-shadow var(--mecha-motion-base) ease,
    filter var(--mecha-motion-base) ease;
}

.hero-primary-btn {
  color: #04111d;
  background: linear-gradient(120deg, rgb(255 148 57 / 0.94), rgb(40 216 255 / 0.92));
  box-shadow: 0 12px 30px rgb(24 145 171 / 0.42);
}

.hero-secondary-btn {
  border: 1px solid rgb(255 255 255 / 0.2);
  color: var(--mecha-text);
  background:
    linear-gradient(155deg, rgb(255 255 255 / 0.08), transparent 34%),
    rgb(16 28 43 / 0.76);
}

.hero-primary-btn:hover,
.hero-secondary-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.hero-stats {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.stat-pill {
  border-radius: var(--mecha-radius-md);
  border: 1px solid rgb(255 255 255 / 0.16);
  background:
    linear-gradient(155deg, rgb(255 255 255 / 0.07), transparent 38%),
    rgb(14 24 37 / 0.72);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-value {
  font-family: var(--mecha-font-display);
  font-size: 26px;
  letter-spacing: 0.04em;
  color: #ecf9ff;
}

.stat-label {
  color: var(--mecha-text-muted);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.device-list-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.skeleton-item {
  position: relative;
  min-height: 148px;
  border-radius: var(--mecha-radius-md);
  border: 1px solid rgb(255 255 255 / 0.16);
  background:
    linear-gradient(155deg, rgb(255 255 255 / 0.08), transparent 38%),
    rgb(13 22 34 / 0.8);
  padding: 18px;
  overflow: hidden;
}

.skeleton-image {
  width: 76px;
  height: 76px;
  border-radius: 10px;
  background: rgb(255 255 255 / 0.08);
}

.skeleton-content {
  margin-top: 14px;
}

.skeleton-line,
.skeleton-line-short {
  border-radius: 6px;
  background: rgb(255 255 255 / 0.08);
}

.skeleton-line {
  width: 72%;
  height: 14px;
}

.skeleton-line-short {
  width: 52%;
  height: 11px;
  margin-top: 10px;
}

.skeleton-item::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(108deg, transparent 28%, rgb(255 255 255 / 0.2) 50%, transparent 72%);
  transform: translateX(-100%);
  animation: mechaShimmer 1.6s ease infinite;
}

.empty-state {
  border-radius: var(--mecha-radius-lg);
  border: 1px dashed rgb(255 255 255 / 0.22);
  background: rgb(12 20 30 / 0.6);
  padding: 34px 20px;
  text-align: center;
  color: var(--mecha-text-muted);
}

.empty-state i {
  font-size: 30px;
  color: var(--mecha-accent-cool);
}

.empty-state p {
  margin: 12px 0 18px;
}

.card-rise-enter-active,
.card-rise-leave-active {
  transition:
    opacity var(--mecha-motion-base) ease,
    transform var(--mecha-motion-base) ease;
}

.card-rise-enter,
.card-rise-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@keyframes mechaShimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 980px) {
  .home-main {
    padding: 14px 12px 8px !important;
  }

  .hero-panel {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-wrap: wrap;
  }

  .device-list-container {
    grid-template-columns: 1fr;
  }
}
</style>
