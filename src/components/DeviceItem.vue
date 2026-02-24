<template>
  <div class="device-item">
    <header class="device-header">
      <h3 class="device-title">{{ device.agentName }}</h3>
      <div class="device-icon-actions">
        <button class="icon-action danger" type="button" @click.stop="handleDelete">
          <img src="@/assets/home/delete.png" alt="delete" />
        </button>
        <el-tooltip class="item" effect="dark" :content="device.systemPrompt" placement="top" popper-class="custom-tooltip">
          <button class="icon-action info" type="button">
            <img src="@/assets/home/info.png" alt="info" />
          </button>
        </el-tooltip>
      </div>
    </header>

    <p class="device-name">{{ $t('home.languageModel') }}: {{ device.llmModelName }}</p>
    <p class="device-name">{{ $t('home.voiceModel') }}: {{ device.ttsModelName }} ({{ device.ttsVoiceName }})</p>

    <div class="settings-row">
      <button class="settings-btn" type="button" @click="handleConfigure">
        {{ $t('home.configureRole') }}
      </button>

      <button v-if="featureStatus.voiceprintRecognition" class="settings-btn" type="button" @click="handleVoicePrint">
        {{ $t('home.voiceprintRecognition') }}
      </button>

      <button class="settings-btn" type="button" @click="handleDeviceManage">
        {{ $t('home.deviceManagement') }}({{ device.deviceCount }})
      </button>

      <el-tooltip v-if="device.memModelId === 'Memory_nomem'" :content="$t('home.enableMemory')" placement="top">
        <button class="settings-btn disabled-btn" type="button" disabled>
          {{ $t('home.chatHistory') }}
        </button>
      </el-tooltip>
      <button v-else class="settings-btn" type="button" @click="handleChatHistory">
        {{ $t('home.chatHistory') }}
      </button>
    </div>

    <div class="version-info">
      <span>{{ $t('home.lastConversation') }}: {{ formattedLastConnectedTime }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeviceItem',
  props: {
    device: { type: Object, required: true },
    featureStatus: {
      type: Object,
      default: () => ({
        voiceprintRecognition: false,
        voiceClone: false,
        knowledgeBase: false
      })
    }
  },
  computed: {
    formattedLastConnectedTime() {
      if (!this.device.lastConnectedAt) return this.$t('home.noConversation');

      const lastTime = new Date(this.device.lastConnectedAt);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastTime) / (1000 * 60));

      if (diffMinutes <= 1) {
        return this.$t('home.justNow');
      } else if (diffMinutes < 60) {
        return this.$t('home.minutesAgo', { minutes: diffMinutes });
      } else if (diffMinutes < 24 * 60) {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return this.$t('home.hoursAgo', { hours, minutes });
      }

      return this.device.lastConnectedAt;
    }
  },
  methods: {
    handleDelete() {
      this.$emit('delete', this.device.agentId);
    },
    handleConfigure() {
      this.$router.push({ path: '/role-config', query: { agentId: this.device.agentId } });
    },
    handleVoicePrint() {
      this.$router.push({ path: '/voice-print', query: { agentId: this.device.agentId } });
    },
    handleDeviceManage() {
      this.$router.push({ path: '/device-management', query: { agentId: this.device.agentId } });
    },
    handleChatHistory() {
      if (this.device.memModelId === 'Memory_nomem') {
        return;
      }
      this.$emit('chat-history', { agentId: this.device.agentId, agentName: this.device.agentName });
    }
  }
};
</script>

<style scoped>
.device-item {
  min-height: 160px;
  border-radius: var(--mecha-radius-md);
  border: 1px solid rgb(255 255 255 / 0.16);
  background:
    linear-gradient(160deg, rgb(255 255 255 / 0.09), transparent 34%),
    rgb(14 24 37 / 0.86);
  padding: 18px;
  box-sizing: border-box;
  transition:
    transform var(--mecha-motion-fast) ease,
    border-color var(--mecha-motion-base) ease,
    box-shadow var(--mecha-motion-base) ease;
}

.device-item:hover {
  transform: translateY(-2px);
  border-color: rgb(40 216 255 / 0.48);
  box-shadow: 0 18px 36px rgb(0 0 0 / 0.35);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.device-title {
  margin: 0;
  text-align: left;
  color: #f0f9ff;
  font-family: var(--mecha-font-display);
  letter-spacing: 0.05em;
  font-size: 17px;
  line-height: 1.2;
}

.device-icon-actions {
  display: inline-flex;
  gap: 8px;
}

.icon-action {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgb(255 255 255 / 0.16);
  background: rgb(255 255 255 / 0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    transform var(--mecha-motion-fast) ease,
    border-color var(--mecha-motion-base) ease,
    background-color var(--mecha-motion-base) ease;
}

.icon-action img {
  width: 15px;
  height: 15px;
}

.icon-action:hover {
  transform: translateY(-1px);
  border-color: rgb(40 216 255 / 0.54);
}

.icon-action.danger:hover {
  border-color: rgb(255 85 112 / 0.6);
  background: rgb(255 85 112 / 0.14);
}

.device-name {
  margin: 9px 0 0;
  text-align: left;
  color: var(--mecha-text-muted);
  font-size: 12px;
  line-height: 1.45;
}

.settings-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.settings-btn {
  height: 28px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid rgb(40 216 255 / 0.44);
  background: rgb(40 216 255 / 0.12);
  color: rgb(203 241 255 / 0.95);
  font-size: 11px;
  font-family: var(--mecha-font-display);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    transform var(--mecha-motion-fast) ease,
    border-color var(--mecha-motion-base) ease,
    background-color var(--mecha-motion-base) ease;
}

.settings-btn:hover {
  transform: translateY(-1px);
  border-color: rgb(255 138 43 / 0.62);
  background: rgb(255 138 43 / 0.18);
}

.disabled-btn,
.disabled-btn:hover {
  cursor: not-allowed;
  border-color: rgb(255 255 255 / 0.2);
  background: rgb(255 255 255 / 0.08);
  color: rgb(255 255 255 / 0.42);
  transform: none;
}

.version-info {
  margin-top: 14px;
  font-size: 12px;
  color: rgb(142 168 196 / 0.92);
  text-align: left;
}
</style>

<style>
.custom-tooltip {
  max-width: 400px;
  word-break: break-word;
}
</style>
