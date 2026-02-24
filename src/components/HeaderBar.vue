<template>
  <el-header class="header">
    <div class="header-container">
      <!-- 左侧元素 -->
      <div class="header-left" @click="goHome">
        <img loading="lazy" alt="" src="@/assets/richard-logo.png" class="logo-img" />
        <span class="brand-wordmark">{{ $t("brand.name") }}</span>
      </div>

      <!-- 中间导航菜单 -->
      <div class="header-center">
        <div class="equipment-management" :class="{
          'active-tab':
            $route.path === '/home' ||
            $route.path === '/role-config' ||
            $route.path === '/device-management',
        }" @click="goHome">
          <img loading="lazy" alt="" src="@/assets/header/robot.png" :style="{
            filter:
              $route.path === '/home' ||
                $route.path === '/role-config' ||
                $route.path === '/device-management'
                ? 'brightness(0) invert(1)'
                : 'None',
          }" />
          <span class="nav-text">{{ $t("header.smartManagement") }}</span>
        </div>
        <!-- Show voice clone entry for regular users -->
        <div v-if="!isSuperAdmin && featureStatus.voiceClone" class="equipment-management"
          :class="{ 'active-tab': $route.path === '/voice-clone-management' }" @click="goVoiceCloneManagement">
          <img loading="lazy" alt="" src="@/assets/header/voice.png" :style="{
            filter:
              $route.path === '/voice-clone-management'
                ? 'brightness(0) invert(1)'
                : 'None',
          }" />
          <span class="nav-text">{{ $t("header.voiceCloneManagement") }}</span>
        </div>

        <!-- Show voice clone dropdown for super admin -->
        <el-dropdown v-if="isSuperAdmin && featureStatus.voiceClone" trigger="click" class="equipment-management more-dropdown" :class="{
          'active-tab':
            $route.path === '/voice-clone-management' ||
            $route.path === '/voice-resource-management',
        }" @visible-change="handleVoiceCloneDropdownVisibleChange">
          <span class="el-dropdown-link">
            <img loading="lazy" alt="" src="@/assets/header/voice.png" :style="{
              filter:
                $route.path === '/voice-clone-management' ||
                  $route.path === '/voice-resource-management'
                  ? 'brightness(0) invert(1)'
                  : 'None',
            }" />
            <span class="nav-text">{{ $t("header.voiceCloneManagement") }}</span>
            <i class="el-icon-arrow-down el-icon--right" :class="{ 'rotate-down': voiceCloneDropdownVisible }"></i>
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item @click.native="goVoiceCloneManagement">
              {{ $t("header.voiceCloneManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="goVoiceResourceManagement">
              {{ $t("header.voiceResourceManagement") }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <div v-if="isSuperAdmin" class="equipment-management" :class="{ 'active-tab': $route.path === '/model-config' }"
          @click="goModelConfig">
          <img loading="lazy" alt="" src="@/assets/header/model_config.png" :style="{
            filter:
              $route.path === '/model-config' ? 'brightness(0) invert(1)' : 'None',
          }" />
          <span class="nav-text">{{ $t("header.modelConfig") }}</span>
        </div>
        <div v-if="featureStatus.knowledgeBase" class="equipment-management"
          :class="{ 'active-tab': $route.path === '/knowledge-base-management' || $route.path === '/knowledge-file-upload' }"
          @click="goKnowledgeBaseManagement">
          <img loading="lazy" alt="" src="@/assets/header/knowledge_base.png" :style="{
            filter:
              $route.path === '/knowledge-base-management' || $route.path === '/knowledge-file-upload' ? 'brightness(0) invert(1)' : 'None',
          }" />
          <span class="nav-text">{{ $t("header.knowledgeBase") }}</span>
        </div>
        <el-dropdown v-if="isSuperAdmin" trigger="click" class="equipment-management more-dropdown" :class="{
          'active-tab':
            $route.path === '/dict-management' ||
            $route.path === '/params-management' ||
            $route.path === '/provider-management' ||
            $route.path === '/server-side-management' ||
            $route.path === '/agent-template-management' ||
            $route.path === '/ota-management' ||
            $route.path === '/user-management' ||
            $route.path === '/feature-management',
        }" @visible-change="handleParamDropdownVisibleChange">
          <span class="el-dropdown-link">
            <img loading="lazy" alt="" src="@/assets/header/param_management.png" :style="{
              filter:
                $route.path === '/dict-management' ||
                  $route.path === '/params-management' ||
                  $route.path === '/provider-management' ||
                  $route.path === '/server-side-management' ||
                  $route.path === '/agent-template-management' ||
                  $route.path === '/ota-management' ||
                  $route.path === '/user-management' ||
                  $route.path === '/feature-management'
                  ? 'brightness(0) invert(1)'
                  : 'None',
            }" />
            <span class="nav-text">{{ $t("header.paramDictionary") }}</span>
            <i class="el-icon-arrow-down el-icon--right" :class="{ 'rotate-down': paramDropdownVisible }"></i>
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item @click.native="goParamManagement">
              {{ $t("header.paramManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="goUserManagement">
              {{ $t("header.userManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="goOtaManagement">
              {{ $t("header.otaManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="goDictManagement">
              {{ $t("header.dictManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="goProviderManagement">
              {{ $t("header.providerManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="goAgentTemplateManagement">
              {{ $t("header.agentTemplate") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="goServerSideManagement">
              {{ $t("header.serverSideManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="goFeatureManagement">
                {{ $t("header.featureManagement") }}
              </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>

      <!-- 右侧元素 -->
      <div class="header-right">
        <div class="search-container" v-if="$route.path === '/home' && !(isSuperAdmin && isSmallScreen)">
          <div class="search-wrapper">
            <el-input v-model="search" :placeholder="$t('header.searchPlaceholder')" class="custom-search-input"
              @keyup.enter.native="handleSearch" @focus="showSearchHistory" @blur="hideSearchHistory" clearable
              ref="searchInput">
              <i slot="suffix" class="el-icon-search search-icon" @click="handleSearch"></i>
            </el-input>
            <span class="search-shortcut">/</span>
            <!-- Search history dropdown -->
            <div v-if="showHistory && searchHistory.length > 0" class="search-history-dropdown">
              <div class="search-history-header">
                <span>{{ $t("header.searchHistory") }}</span>
                <el-button type="text" size="small" class="clear-history-btn" @click="clearSearchHistory">
                  {{ $t("header.clearHistory") }}
                </el-button>
              </div>
              <div class="search-history-list">
                <div v-for="(item, index) in searchHistory" :key="index" class="search-history-item"
                  @click.stop="selectSearchHistory(item)">
                  <span class="history-text">{{ item }}</span>
                  <i class="el-icon-close clear-item-icon" @click.stop="removeSearchHistory(index)"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <img loading="lazy" alt="" src="@/assets/home/avatar.png" class="avatar-img" @click="handleAvatarClick" />
        <span class="el-user-dropdown" @click="handleAvatarClick">
          {{ userInfo.username || "Loading..." }}
          <i class="el-icon-arrow-down el-icon--right" :class="{ 'rotate-down': userMenuVisible }"></i>
        </span>
        <el-cascader :options="userMenuOptions" trigger="click" :props="cascaderProps"
          style="width: 0px; overflow: hidden" :show-all-levels="false" @change="handleCascaderChange"
          @visible-change="handleUserMenuVisibleChange" ref="userCascader">
          <template slot-scope="{ data }">
            <span>{{ data.label }}</span>
          </template>
        </el-cascader>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <ChangePasswordDialog v-model="isChangePasswordDialogVisible" />
  </el-header>
</template>

<script>
import userApi from "@/apis/module/user";
import i18n, { changeLanguage } from "@/i18n";
import { mapActions, mapGetters } from "vuex";
import ChangePasswordDialog from "./ChangePasswordDialog.vue"; // 引入修改密码弹窗组件
import featureManager from "@/utils/featureManager"; // Import feature manager utility

export default {
  name: "HeaderBar",
  components: {
    ChangePasswordDialog,
  },
  props: ["devices"], // Device list passed from parent
  data() {
    return {
      search: "",
      userInfo: {
        username: "",
        mobile: "",
      },
      isChangePasswordDialogVisible: false, // Controls change-password dialog visibility
      paramDropdownVisible: false,
      voiceCloneDropdownVisible: false,
      userMenuVisible: false, // User menu visibility state
      menuVisibleTimer: null, // Timer used to avoid rapid visibility toggling
      isSmallScreen: false,
      // 搜索历史相关
      searchHistory: [],
      showHistory: false,
      SEARCH_HISTORY_KEY: "richard_search_history",
      MAX_HISTORY_COUNT: 3,
      // Cascader 配置
      cascaderProps: {
        expandTrigger: "click",
        value: "value",
        label: "label",
        children: "children",
      },
      // Feature toggle states
      featureStatus: {
        voiceClone: false, // Voice clone feature state
        knowledgeBase: false, // Knowledge base feature state
      },
    };
  },
  computed: {
    ...mapGetters(["getIsSuperAdmin"]),
    isSuperAdmin() {
      return this.getIsSuperAdmin;
    },
    // 获取当前语言
    currentLanguage() {
      return i18n.locale || "zh_CN";
    },
    // 获取当前语言显示文本
    currentLanguageText() {
      const currentLang = this.currentLanguage;
      switch (currentLang) {
        case "zh_CN":
          return this.$t("language.zhCN");
        case "zh_TW":
          return this.$t("language.zhTW");
        case "en":
          return this.$t("language.en");
        case "de":
          return this.$t("language.de");
        case "vi":
          return this.$t("language.vi");
        default:
          return this.$t("language.zhCN");
      }
    },
    // 根据当前语言获取对应的richard-ai图标
    richardAiIcon() {
      const currentLang = this.currentLanguage;
      switch (currentLang) {
        case "zh_CN":
          return require("@/assets/richard-ai.png");
        case "zh_TW":
          return require("@/assets/richard-ai_zh_TW.png");
        case "en":
          return require("@/assets/richard-ai_en.png");
        case "de":
          return require("@/assets/richard-ai_de.png");
        case "vi":
          return require("@/assets/richard-ai_vi.png");
        default:
          return require("@/assets/richard-ai.png");
      }
    },
    // 用户菜单选项
    userMenuOptions() {
      return [
        {
          label: this.currentLanguageText,
          value: "language",
          children: [
            {
              label: this.$t("language.zhCN"),
              value: "zh_CN",
            },
            {
              label: this.$t("language.zhTW"),
              value: "zh_TW",
            },
            {
              label: this.$t("language.en"),
              value: "en",
            },
            {
              label: this.$t("language.de"),
              value: "de",
            },
            {
              label: this.$t("language.vi"),
              value: "vi",
            },
          ],
        },
        {
          label: this.$t("header.changePassword"),
          value: "changePassword",
        },
        {
          label: this.$t("header.logout"),
          value: "logout",
        },
      ];
    },
  },
  async mounted() {
    this.fetchUserInfo();
    this.checkScreenSize();
    window.addEventListener("resize", this.checkScreenSize);
    // 从localStorage加载搜索历史
    this.loadSearchHistory();
    // Wait for featureManager initialization before loading feature states
    await this.loadFeatureStatus();
    document.addEventListener("keydown", this.handleGlobalShortcut);
  },
  // Remove listeners
  beforeDestroy() {
    window.removeEventListener("resize", this.checkScreenSize);
    document.removeEventListener("keydown", this.handleGlobalShortcut);
  },
  methods: {
    handleGlobalShortcut(event) {
      if (this.$route.path !== "/home") {
        return;
      }

      const target = event.target;
      const tagName = target && target.tagName ? target.tagName.toLowerCase() : "";
      const isEditable =
        tagName === "input" ||
        tagName === "textarea" ||
        (target && target.isContentEditable);

      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isEditable
      ) {
        event.preventDefault();
        this.focusSearchInput();
        return;
      }

      if (event.key === "Escape" && this.search) {
        this.search = "";
        this.showHistory = false;
        this.$emit("search-reset");

        if (this.$refs.searchInput && this.$refs.searchInput.blur) {
          this.$refs.searchInput.blur();
        }
      }
    },
    focusSearchInput() {
      this.$nextTick(() => {
        if (this.$refs.searchInput && this.$refs.searchInput.focus) {
          this.$refs.searchInput.focus();
        }
      });
    },
    goHome() {
      // Navigate to home page
      this.$router.push("/home");
    },
    goUserManagement() {
      this.$router.push("/user-management");
    },
    goModelConfig() {
      this.$router.push("/model-config");
    },
    goKnowledgeBaseManagement() {
      this.$router.push("/knowledge-base-management");
    },
    goVoiceCloneManagement() {
      this.$router.push("/voice-clone-management");
    },
    goParamManagement() {
      this.$router.push("/params-management");
    },
    goOtaManagement() {
      this.$router.push("/ota-management");
    },
    goDictManagement() {
      this.$router.push("/dict-management");
    },
    goProviderManagement() {
      this.$router.push("/provider-management");
    },
    goServerSideManagement() {
      this.$router.push("/server-side-management");
    },

    // Navigate to voice resource management
    goVoiceResourceManagement() {
      this.$router.push("/voice-resource-management");
    },
    // 添加默认角色模板管理导航方法
    goAgentTemplateManagement() {
      this.$router.push("/agent-template-management");
    },
    // Navigate to feature management
    goFeatureManagement() {
      this.$router.push("/feature-management");
    },
    // Load feature states
    async loadFeatureStatus() {
      // Wait for featureManager initialization
      await featureManager.waitForInitialization();
      
      const config = featureManager.getConfig();
      
      this.featureStatus.voiceClone = config.voiceClone;
      this.featureStatus.knowledgeBase = config.knowledgeBase;
    },
    // 获取用户信息
    fetchUserInfo() {
      userApi.getUserInfo(({ data }) => {
        this.userInfo = data.data;
        if (data.data.superAdmin !== undefined) {
          this.$store.commit("setUserInfo", data.data);
        }
      });
    },
    checkScreenSize() {
      this.isSmallScreen = window.innerWidth <= 1386;
    },
    // 处理搜索
    handleSearch() {
      const searchValue = this.search.trim();

      // If search keyword is empty, emit reset event
      if (!searchValue) {
        this.$emit("search-reset");
        return;
      }

      // 保存搜索历史
      this.saveSearchHistory(searchValue);

      // Emit search event to parent with keyword
      this.$emit("search", searchValue);

      // Blur input after search so blur handler can hide history dropdown
      if (this.$refs.searchInput) {
        this.$refs.searchInput.blur();
      }
    },

    // 显示搜索历史
    showSearchHistory() {
      this.showHistory = true;
    },

    // 隐藏搜索历史
    hideSearchHistory() {
      // Delay hide to allow click events to run
      setTimeout(() => {
        this.showHistory = false;
      }, 200);
    },

    // 加载搜索历史
    loadSearchHistory() {
      try {
        const history = localStorage.getItem(this.SEARCH_HISTORY_KEY);
        if (history) {
          this.searchHistory = JSON.parse(history);
        }
      } catch (error) {
        console.error("Failed to load search history:", error);
        this.searchHistory = [];
      }
    },

    // 保存搜索历史
    saveSearchHistory(keyword) {
      if (!keyword || this.searchHistory.includes(keyword)) {
        return;
      }

      // Add item to the front of history
      this.searchHistory.unshift(keyword);

      // 限制历史记录数量
      if (this.searchHistory.length > this.MAX_HISTORY_COUNT) {
        this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY_COUNT);
      }

      // 保存到localStorage
      try {
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(this.searchHistory));
      } catch (error) {
        console.error("Failed to save search history:", error);
      }
    },

    // Select a history item
    selectSearchHistory(keyword) {
      this.search = keyword;
      this.handleSearch();
    },

    // Remove a single history item
    removeSearchHistory(index) {
      this.searchHistory.splice(index, 1);
      try {
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(this.searchHistory));
      } catch (error) {
        console.error("Failed to update search history:", error);
      }
    },

    // Clear all history items
    clearSearchHistory() {
      this.searchHistory = [];
      try {
        localStorage.removeItem(this.SEARCH_HISTORY_KEY);
      } catch (error) {
        console.error("Failed to clear search history:", error);
      }
    },
    // 显示修改密码弹窗
    showChangePasswordDialog() {
      this.isChangePasswordDialogVisible = true;
      // Reset user menu visibility after opening change-password dialog
      this.userMenuVisible = false;
    },
    // Logout
    async handleLogout() {
      try {
        // Call Vuex logout action
        await this.logout();
        this.$message.success({
          message: this.$t("message.success"),
          showClose: true,
        });
      } catch (error) {
        console.error("Logout failed:", error);
        this.$message.error({
          message: this.$t("message.error"),
          showClose: true,
        });
      }
    },
    // Track param dropdown visibility
    handleParamDropdownVisibleChange(visible) {
      this.paramDropdownVisible = visible;
    },

    // Track voice clone dropdown visibility
    handleVoiceCloneDropdownVisibleChange(visible) {
      this.voiceCloneDropdownVisible = visible;
    },
    // 在data中添加一个key用于强制重新渲染组件
    // 处理 Cascader 选择变化
    handleCascaderChange(value) {
      if (!value || value.length === 0) {
        return;
      }

      const action = value[value.length - 1];

      // 处理语言切换
      if (value.length === 2 && value[0] === "language") {
        this.changeLanguage(action);
      } else {
        // 处理其他操作
        switch (action) {
          case "changePassword":
            this.showChangePasswordDialog();
            break;
          case "logout":
            this.handleLogout();
            break;
        }
      }

      // Clear cascader selection after action is handled
      setTimeout(() => {
        this.completeResetCascader();
      }, 300);
    },

    // 切换语言
    changeLanguage(lang) {
      changeLanguage(lang);
      this.$message.success({
        message: this.$t("message.success"),
        showClose: true,
      });
      // Reset user menu visibility after language change
      this.userMenuVisible = false;
    },

    // Fully reset cascader selection
    completeResetCascader() {
      if (this.$refs.userCascader) {
        try {
          // Try all available ways to clear cascader selection
          // 1. 尝试使用组件提供的clearValue方法
          if (this.$refs.userCascader.clearValue) {
            this.$refs.userCascader.clearValue();
          }

          // 2. Reset internal state directly
          if (this.$refs.userCascader.$data) {
            this.$refs.userCascader.$data.selectedPaths = [];
            this.$refs.userCascader.$data.displayLabels = [];
            this.$refs.userCascader.$data.inputValue = "";
            this.$refs.userCascader.$data.checkedValue = [];
            this.$refs.userCascader.$data.showAllLevels = false;
          }

          // 3. Remove active/checked classes from DOM nodes
          const menuElement = this.$refs.userCascader.$refs.menu;
          if (menuElement && menuElement.$el) {
            const activeItems = menuElement.$el.querySelectorAll(
              ".el-cascader-node.is-active"
            );
            activeItems.forEach((item) => item.classList.remove("is-active"));

            const checkedItems = menuElement.$el.querySelectorAll(
              ".el-cascader-node.is-checked"
            );
            checkedItems.forEach((item) => item.classList.remove("is-checked"));
          }

          console.log("Cascader values cleared");
        } catch (error) {
          console.error("Failed to clear cascader selection:", error);
        }
      }
    },

    // 点击头像触发cascader下拉菜单
    handleAvatarClick() {
      if (this.$refs.userCascader) {
        // Toggle menu visibility
        this.userMenuVisible = !this.userMenuVisible;

        // Clear selected value when menu closes
        if (!this.userMenuVisible) {
          this.completeResetCascader();
        }

        // Set menu visibility directly
        try {
          // 尝试使用toggleDropDownVisible方法
          this.$refs.userCascader.toggleDropDownVisible(this.userMenuVisible);
        } catch (error) {
          // Fallback to direct menu control if toggle method fails
          if (this.$refs.userCascader.$refs.menu) {
            this.$refs.userCascader.$refs.menu.showMenu(this.userMenuVisible);
          } else {
            console.error("Cannot access menu component");
          }
        }
      }
    },

    // Handle user menu visibility change
    handleUserMenuVisibleChange(visible) {
      if (this.menuVisibleTimer) return;
      this.menuVisibleTimer = setTimeout(() => {
        this.userMenuVisible = visible;
        clearTimeout(this.menuVisibleTimer);
        this.menuVisibleTimer = null;
      }, 100);

      // Also clear selected value when menu closes
      if (!visible) {
        this.completeResetCascader();
      }
    },

    // Inject Vuex logout action via mapActions
    ...mapActions(["logout"]),
  },
};
</script>

<style lang="scss" scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 74px !important;
  min-width: 0;
  border-bottom: 1px solid rgb(255 255 255 / 0.14);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.08), transparent 52%),
    rgb(10 17 28 / 0.86);
  backdrop-filter: blur(14px);
  box-shadow: 0 12px 34px rgb(0 0 0 / 0.32);
}

.header-container {
  height: 100%;
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-left {
  flex-shrink: 0;
  min-width: 160px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.14);
  background: rgb(255 255 255 / 0.06);
  cursor: pointer;
  transition:
    border-color var(--mecha-motion-base) ease,
    box-shadow var(--mecha-motion-base) ease,
    transform var(--mecha-motion-fast) ease;
}

.header-left:hover {
  transform: translateY(-1px);
  border-color: rgb(40 216 255 / 0.46);
  box-shadow: 0 0 18px rgb(40 216 255 / 0.18);
}

.logo-img {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.brand-wordmark {
  display: inline-block;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--mecha-font-display);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #eaf8ff;
}

.header-center {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  overflow-x: auto;
  scrollbar-width: none;
}

.header-center::-webkit-scrollbar {
  display: none;
}

.header-right {
  min-width: 210px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.equipment-management {
  position: relative;
  flex-shrink: 0;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.16);
  background:
    linear-gradient(155deg, rgb(255 255 255 / 0.1), transparent 38%),
    rgb(17 28 43 / 0.78);
  color: var(--mecha-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition:
    transform var(--mecha-motion-fast) ease,
    border-color var(--mecha-motion-base) ease,
    box-shadow var(--mecha-motion-base) ease,
    color var(--mecha-motion-base) ease;
}

.equipment-management:hover {
  transform: translateY(-1px);
  color: #f1fbff;
  border-color: rgb(40 216 255 / 0.52);
  box-shadow: 0 0 18px rgb(40 216 255 / 0.22);
}

.equipment-management.active-tab {
  border-color: rgb(255 138 43 / 0.62) !important;
  color: #06131f !important;
  background:
    linear-gradient(130deg, rgb(255 168 77 / 0.92), rgb(40 216 255 / 0.9)) !important;
  box-shadow: 0 12px 28px rgb(24 145 171 / 0.38);
}

.equipment-management img {
  width: 14px;
  height: 14px;
}

.more-dropdown {
  padding: 0;
}

.more-dropdown .el-dropdown-link {
  height: 100%;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.search-container {
  min-width: 200px;
  width: min(320px, 26vw);
}

.search-wrapper {
  position: relative;
}

.search-shortcut {
  position: absolute;
  right: 38px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-family: var(--mecha-font-display);
  color: rgb(142 168 196 / 0.82);
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 4px;
  padding: 0 5px;
  line-height: 16px;
  pointer-events: none;
  transition: opacity var(--mecha-motion-fast) ease;
}

.search-wrapper:focus-within .search-shortcut {
  opacity: 0;
}

.search-history-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 12;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 12px;
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.08), transparent 34%),
    rgb(11 19 30 / 0.95);
  box-shadow: 0 18px 40px rgb(0 0 0 / 0.35);
  overflow: hidden;
}

.search-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  color: var(--mecha-text-muted);
  font-size: 11px;
  border-bottom: 1px solid rgb(255 255 255 / 0.08);
}

.clear-history-btn {
  padding: 0;
  color: var(--mecha-accent-cool);
  font-size: 11px;
}

.clear-history-btn:hover {
  color: #d9f7ff;
}

.search-history-list {
  max-height: 220px;
  overflow-y: auto;
}

.search-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  font-size: 12px;
  color: var(--mecha-text-muted);
  cursor: pointer;
  transition: background-color var(--mecha-motion-fast) ease;
}

.search-history-item:hover {
  color: #f3fbff;
  background: rgb(40 216 255 / 0.14);
}

.clear-item-icon {
  visibility: hidden;
  color: var(--mecha-danger);
}

.search-history-item:hover .clear-item-icon {
  visibility: visible;
}

.custom-search-input::v-deep .el-input__inner {
  height: 34px;
  border-radius: 999px;
  background:
    linear-gradient(165deg, rgb(255 255 255 / 0.1), transparent 36%),
    rgb(13 22 34 / 0.84);
  border: 1px solid rgb(255 255 255 / 0.18);
  padding-left: 12px;
  padding-right: 52px;
  font-size: 12px;
  color: var(--mecha-text);
}

.custom-search-input::v-deep .el-input__inner:focus {
  border-color: rgb(40 216 255 / 0.6);
  box-shadow:
    0 0 0 1px rgb(40 216 255 / 0.45),
    0 0 0 4px rgb(40 216 255 / 0.16);
}

.custom-search-input::v-deep .el-input__clear {
  color: var(--mecha-text-muted);
}

.custom-search-input::v-deep .el-input__suffix-inner {
  display: inline-flex;
  align-items: center;
}

.search-icon {
  font-size: 14px;
  color: var(--mecha-accent-cool);
  cursor: pointer;
}

.avatar-img {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.22);
  cursor: pointer;
  transition:
    border-color var(--mecha-motion-base) ease,
    box-shadow var(--mecha-motion-base) ease;
}

.avatar-img:hover {
  border-color: rgb(40 216 255 / 0.6);
  box-shadow: 0 0 14px rgb(40 216 255 / 0.28);
}

.el-user-dropdown {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  font-size: 13px;
  color: var(--mecha-text);
}

.nav-text {
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.rotate-down {
  transform: rotate(180deg);
  transition: transform var(--mecha-motion-base) ease;
}

.el-icon-arrow-down {
  transition: transform var(--mecha-motion-base) ease;
}

@media (max-width: 1500px) {
  .equipment-management {
    padding: 0 11px;
  }

  .nav-text {
    font-size: 11px;
  }
}

@media (max-width: 1240px) {
  .header {
    height: auto !important;
    min-height: 74px;
  }

  .header-container {
    flex-wrap: wrap;
    padding: 8px 12px;
  }

  .header-center {
    order: 3;
    width: 100%;
    justify-content: flex-start;
    padding-bottom: 4px;
  }

  .header-right {
    margin-left: auto;
  }

  .search-container {
    width: 240px;
  }
}

@media (max-width: 840px) {
  .header-left {
    min-width: auto;
    padding: 4px 8px;
  }

  .brand-wordmark {
    display: none;
  }

  .search-container {
    min-width: 160px;
    width: 190px;
  }

  .el-user-dropdown {
    max-width: 90px;
  }
}
</style>



