const fs = require("fs");
const os = require("os");
const path = require("path");
const { app } = require("electron");

// 统一维护可持久化的设置项，避免主进程和渲染层对默认值理解不一致。
const DEFAULT_SETTINGS = {
  font: "Geometric",
  background: "gradient-1",
  countdownNotify: true,
  muteSound: false,
  alwaysOnTop: true,
  showDate: true,
  hour24: true,
  showMs: false,
  clockShowMs: false,
  countdownShowMs: false,
  floatingOpacity: 1,
  customBgImage: null,
};

const LEGACY_CONFIG_PATH = path.join(os.homedir(), ".floating-clock-config.json");
const LEGACY_MIGRATION_MARKER = ".legacy-config-migrated";

let settingsStore = null;

function normalizeSettings(raw = {}) {
  return Object.keys(DEFAULT_SETTINGS).reduce((accumulator, key) => {
    accumulator[key] =
      raw[key] !== undefined ? raw[key] : DEFAULT_SETTINGS[key];
    return accumulator;
  }, {});
}

function getLegacyMigrationMarkerPath() {
  return path.join(app.getPath("userData"), LEGACY_MIGRATION_MARKER);
}

function hasLegacyMigrationRun() {
  return fs.existsSync(getLegacyMigrationMarkerPath());
}

function markLegacyMigrationDone() {
  const markerPath = getLegacyMigrationMarkerPath();
  fs.writeFileSync(markerPath, String(Date.now()));
}

function migrateLegacyConfigIfNeeded(store) {
  if (hasLegacyMigrationRun()) return;

  try {
    if (fs.existsSync(LEGACY_CONFIG_PATH)) {
      const legacyRaw = JSON.parse(fs.readFileSync(LEGACY_CONFIG_PATH, "utf8"));
      const nextSettings = normalizeSettings({
        ...store.store,
        ...legacyRaw,
      });
      store.set(nextSettings);
    }
  } catch (error) {
    console.error("迁移旧配置失败:", error);
  } finally {
    // 迁移只尝试一次，避免每次启动都重复解析旧文件。
    markLegacyMigrationDone();
  }
}

async function initConfigStore() {
  if (settingsStore) return settingsStore;

  const { default: Store } = await import("electron-store");
  settingsStore = new Store({
    name: "settings",
    defaults: DEFAULT_SETTINGS,
  });

  migrateLegacyConfigIfNeeded(settingsStore);
  return settingsStore;
}

function getSettingsStore() {
  if (!settingsStore) {
    throw new Error("配置存储尚未初始化，请先调用 initConfigStore()");
  }
  return settingsStore;
}

function loadConfig() {
  const store = getSettingsStore();
  return normalizeSettings(store.store);
}

function saveConfig(data = {}) {
  try {
    const store = getSettingsStore();
    const nextSettings = normalizeSettings({
      ...store.store,
      ...data,
    });
    store.set(nextSettings);
    return true;
  } catch (error) {
    console.error("保存配置失败:", error);
    return false;
  }
}

module.exports = {
  DEFAULT_SETTINGS,
  initConfigStore,
  loadConfig,
  normalizeSettings,
  saveConfig,
};
