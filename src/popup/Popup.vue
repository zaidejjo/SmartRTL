<template>
  <div class="popup-container" :class="themeClass" :dir="uiLang === 'ar' ? 'rtl' : 'ltr'">
    <header class="header">
      <div class="brand">
        <div class="brand-icon">
          <ArrowLeftRight :size="14" stroke-width="2.5" />
        </div>
        <h1 class="brand-title">{{ t('extName') }}</h1>
      </div>
      <div class="header-actions">
        <select v-model="uiLang" @change="changeLanguage(uiLang)" class="lang-dropdown">
          <option value="en">EN</option>
          <option value="ar">عربي</option>
        </select>
        <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'">
          <Sun v-if="theme === 'dark'" :size="14" stroke-width="2" />
          <Moon v-else :size="14" stroke-width="2" />
        </button>
      </div>
    </header>

    <!-- ON/OFF Master Toggle -->
    <div class="status-row">
      <span class="section-label">{{ t('extensionStatus') }}</span>
      <button class="power-btn" :class="{ active: isEnabled }" @click="toggleEnabled">
        <Power :size="13" stroke-width="2.5" />
        <span>{{ isEnabled ? t('statusEnabled') : t('statusDisabled') }}</span>
      </button>
    </div>

    <main class="main-content" :class="{ disabled: !isEnabled }">
      <div class="section-label">{{ t('directionMode') }}</div>
      <div class="segmented-control">
        <button
          v-for="mode in modes"
          :key="mode.id"
          class="segment-btn"
          :class="{ active: currentMode === mode.id }"
          :disabled="!isEnabled"
          @click="selectMode(mode.id)"
        >
          {{ t(mode.labelKey) }}
        </button>
      </div>
    </main>

    <footer class="footer">
      <div class="info-note">
        <Code :size="12" stroke-width="2" class="info-icon" />
        <span>{{ t('codeProtection') }}</span>
      </div>
      <div class="version">v1.0.0</div>
    </footer>

    <div class="status-toast" :style="{ opacity: toastMessage ? 1 : 0 }">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ArrowLeftRight, Code, Sun, Moon, Power } from 'lucide-vue-next';

const uiLang = ref('en');
const theme = ref('dark');
const isEnabled = ref(true);

const themeClass = computed(() => {
  return theme.value === 'dark' ? 'theme-dark' : 'theme-light';
});

const dict = {
  en: {
    extName: 'SmartRTL',
    extensionStatus: 'Status',
    statusEnabled: 'Enabled',
    statusDisabled: 'Disabled',
    directionMode: 'Direction Mode',
    autoDetect: 'Auto',
    forceRtl: 'Force RTL',
    forceLtr: 'Force LTR',
    codeProtection: 'Code blocks locked to LTR',
    settingsSaved: 'Saved'
  },
  ar: {
    extName: 'SmartRTL',
    extensionStatus: 'الحالة',
    statusEnabled: 'مفعل',
    statusDisabled: 'معطل',
    directionMode: 'وضع الاتجاه',
    autoDetect: 'تلقائي',
    forceRtl: 'فرض RTL',
    forceLtr: 'فرض LTR',
    codeProtection: 'تم قفل الأكواد لليسار',
    settingsSaved: 'تم الحفظ'
  }
};

function t(key) {
  return dict[uiLang.value]?.[key] || dict['en'][key] || key;
}

const modes = [
  { id: 'auto', labelKey: 'autoDetect' },
  { id: 'force-rtl', labelKey: 'forceRtl' },
  { id: 'force-ltr', labelKey: 'forceLtr' }
];

const currentMode = ref('auto');
const toastMessage = ref('');
let toastTimeout = null;

function showToast(msg) {
  toastMessage.value = msg;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMessage.value = '';
  }, 1500);
}

onMounted(() => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['smartRtlEnabled', 'smartRtlMode', 'smartRtlLang', 'smartRtlTheme'], (result) => {
      if (result.smartRtlEnabled !== undefined) isEnabled.value = result.smartRtlEnabled;
      if (result.smartRtlMode) currentMode.value = result.smartRtlMode;
      if (result.smartRtlLang) uiLang.value = result.smartRtlLang;
      if (result.smartRtlTheme) {
        theme.value = result.smartRtlTheme;
      } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          theme.value = 'light';
        }
      }
    });
  }
});

function toggleEnabled() {
  isEnabled.value = !isEnabled.value;
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ smartRtlEnabled: isEnabled.value }, () => {
      showToast(t('settingsSaved'));
    });
  } else {
    showToast(t('settingsSaved'));
  }
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ smartRtlTheme: theme.value });
  }
}

function changeLanguage(lang) {
  uiLang.value = lang;
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ smartRtlLang: lang });
  }
}

function selectMode(modeId) {
  if (!isEnabled.value) return;
  currentMode.value = modeId;
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ smartRtlMode: modeId }, () => {
      showToast(t('settingsSaved'));
    });
  } else {
    showToast(t('settingsSaved'));
  }
}
</script>

<style scoped>
.theme-dark {
  --bg-color: #0F0F0F;
  --card-bg: #171717;
  --text-main: #FFFFFF;
  --text-muted: #737373;
  --border-color: #262626;
  --accent-bg: #FFFFFF;
  --accent-text: #0F0F0F;
  --hover-bg: #222222;
}

.theme-light {
  --bg-color: #FFFFFF;
  --card-bg: #F5F5F5;
  --text-main: #000000;
  --text-muted: #737373;
  --border-color: #E5E5E5;
  --accent-bg: #000000;
  --accent-text: #FFFFFF;
  --hover-bg: #EAEAEA;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
}

body {
  width: 300px;
  background-color: var(--bg-color);
  color: var(--text-main);
  user-select: none;
}

.popup-container {
  background-color: var(--bg-color);
  color: var(--text-main);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-icon {
  width: 22px;
  height: 22px;
  background-color: var(--text-main);
  color: var(--bg-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.lang-dropdown {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-main);
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  outline: none;
  cursor: pointer;
}

.theme-toggle {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-main);
  width: 26px;
  height: 26px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.theme-toggle:hover {
  background-color: var(--hover-bg);
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.power-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.power-btn.active {
  background: var(--accent-bg);
  color: var(--accent-text);
  border-color: var(--accent-bg);
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: opacity 0.2s ease;
}

.main-content.disabled {
  opacity: 0.4;
  pointer-events: none;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.segmented-control {
  display: flex;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 3px;
  gap: 3px;
}

.segment-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  padding: 6px 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
  white-space: nowrap;
}

.segment-btn:hover:not(:disabled) {
  color: var(--text-main);
}

.segment-btn.active {
  background-color: var(--accent-bg);
  color: var(--accent-text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  font-size: 10px;
  color: var(--text-muted);
}

.info-note {
  display: flex;
  align-items: center;
  gap: 4px;
}

.version {
  font-family: monospace;
}

.status-toast {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--text-main);
  color: var(--bg-color);
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  transition: opacity 0.2s ease;
  pointer-events: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
</style>
