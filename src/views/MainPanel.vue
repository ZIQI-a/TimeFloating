<template>
  <div class="main-panel">
    <!-- 左侧展示区：随 Tab 联动 -->
    <div class="left-panel" :style="leftPanelStyle">
      <!-- 时钟模式 -->
      <transition name="left-fade" mode="out-in">
        <div v-if="activeTab === 'clock'" key="clock" class="left-content">
          <div class="left-time tabular" :class="fontClass">
            {{ clockTimeOnlyWithMs }}
          </div>
          <div v-if="settings.showDate" class="left-date">
            {{ currentDate
            }}<span v-if="clockAmPm" class="ampm-tag">{{ clockAmPm }}</span>
          </div>
        </div>

        <!-- 秒表模式 -->
        <div
          v-else-if="activeTab === 'stopwatch'"
          key="stopwatch"
          class="left-content"
        >
          <div class="left-time tabular sw-time" :class="fontClass">
            {{ formattedStopwatch }}
          </div>
          <div class="left-sub">
            {{
              stopwatchRunning
                ? "计时中…"
                : stopwatchTime > 0
                  ? "已暂停"
                  : "准备开始"
            }}
          </div>
        </div>

        <!-- 倒计时模式 -->
        <div
          v-else-if="activeTab === 'countdown'"
          key="countdown"
          class="left-content"
        >
          <div
            class="left-time tabular cd-time"
            :class="[fontClass, { 'cd-ending': countdownEnding }]"
          >
            {{ formattedCountdown }}
          </div>
          <div class="left-sub">
            {{
              countdownRunning
                ? "倒计时中…"
                : countdownFinished
                  ? "时间到！🎉"
                  : "准备开始"
            }}
          </div>
        </div>
      </transition>
    </div>

    <!-- 右侧控制区 -->
    <div class="right-panel">
      <!-- 胶囊 Tab 切换器 -->
      <div class="capsule-tab-wrapper">
        <div class="capsule-track">
          <!-- 滑动指示器 -->
          <div class="capsule-indicator" :style="indicatorStyle"></div>
          <button
            v-for="(tab, index) in tabs"
            :key="tab.id"
            class="capsule-btn"
            :class="{ active: activeTab === tab.id }"
            @click="switchTab(tab.id, index)"
          >
            {{ tab.name }}
          </button>
        </div>
      </div>

      <!-- 右侧内容区（带切换动画） -->
      <div class="right-content-area">
        <transition :name="tabTransitionName" mode="out-in">
          <!-- 时钟面板 -->
          <div v-if="activeTab === 'clock'" key="clock" class="panel-section">
            <div class="panel-title">时钟设置</div>
            <div class="clock-options">
              <div class="option-row">
                <span class="option-label">显示日期</span>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.showDate" />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="option-row">
                <span class="option-label">24 小时制</span>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    v-model="settings.hour24"
                    @change="updateTime"
                  />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="option-row">
                <span class="option-label">显示毫秒</span>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.clockShowMs" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- 秒表面板 -->
          <div
            v-else-if="activeTab === 'stopwatch'"
            key="stopwatch"
            class="panel-section"
          >
            <div class="panel-title">秒表</div>
            <div class="control-buttons">
              <button
                class="ctrl-btn"
                :class="stopwatchRunning ? 'btn-pause' : 'btn-start'"
                @click="toggleStopwatch"
              >
                {{ stopwatchRunning ? "⏸ 暂停" : "▶ 开始" }}
              </button>
              <button class="ctrl-btn btn-reset" @click="resetStopwatch">
                ↺ 重置
              </button>
              <!-- 毫秒切换 icon 按钮 -->
              <button
                class="ms-toggle-btn"
                :class="{ active: settings.showMs }"
                @click="settings.showMs = !settings.showMs"
                title="显示毫秒"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 15" />
                  <circle
                    cx="12"
                    cy="12"
                    r="1.5"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
                <span class="ms-label">.0</span>
              </button>
            </div>
          </div>

          <!-- 倒计时面板 -->
          <div
            v-else-if="activeTab === 'countdown'"
            key="countdown"
            class="panel-section"
          >
            <div class="panel-title">倒计时 / 番茄钟</div>

            <div class="time-input-container">
              <div class="time-unit">
                <label>H</label>
                <input
                  v-model.number="countdownHours"
                  type="number"
                  min="0"
                  max="99"
                  placeholder="00"
                  :disabled="countdownRunning"
                  @blur="clampCountdown"
                />
              </div>
              <span class="colon">:</span>
              <div class="time-unit">
                <label>M</label>
                <input
                  v-model.number="countdownMinutes"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="00"
                  :disabled="countdownRunning"
                  @blur="clampCountdown"
                />
              </div>
              <span class="colon">:</span>
              <div class="time-unit">
                <label>S</label>
                <input
                  v-model.number="countdownSeconds"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="00"
                  :disabled="countdownRunning"
                  @blur="clampCountdown"
                />
              </div>
            </div>

            <div class="control-buttons">
              <button
                class="ctrl-btn"
                :class="countdownRunning ? 'btn-pause' : 'btn-start'"
                @click="toggleCountdown"
              >
                {{ countdownRunning ? "⏸ 暂停" : "▶ 开始" }}
              </button>
              <button class="ctrl-btn btn-reset" @click="resetCountdown">
                ↺ 重置
              </button>
              <!-- 毫秒切换 icon 按钮 -->
              <button
                class="ms-toggle-btn"
                :class="{ active: settings.countdownShowMs }"
                @click="settings.countdownShowMs = !settings.countdownShowMs"
                title="显示毫秒"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 15" />
                  <circle
                    cx="12"
                    cy="12"
                    r="1.5"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
                <span class="ms-label">.0</span>
              </button>
            </div>

            <div class="preset-chips">
              <button class="chip" @click="applyPreset(25)">
                <svg class="icon" aria-hidden="true">
                  <use xlink:href="#icon-fanqie"></use></svg
                >25分钟
              </button>
              <button class="chip" @click="applyPreset(5)">
                <svg class="icon" aria-hidden="true">
                  <use xlink:href="#icon-kafei"></use></svg
                >5分钟
              </button>
              <button class="chip" @click="applyPreset(10)">
                <svg class="icon" aria-hidden="true">
                  <use xlink:href="#icon-mingxiangfangsong-ico"></use></svg
                >10分钟
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- 底部设置区（始终显示） -->
      <div class="settings-section">
        <div class="settings-divider"></div>

        <!-- 背景主题 -->
        <div class="setting-group">
          <label class="setting-label">背景主题</label>
          <div class="background-options">
            <div
              v-for="bg in backgroundOptions"
              :key="bg.value"
              :class="[
                'bg-option',
                { active: settings.background === bg.value },
              ]"
              :style="{ background: bg.preview }"
              @click="settings.background = bg.value"
            ></div>
          </div>
        </div>

        <!-- 字体 -->
        <div class="setting-group">
          <label class="setting-label">字体风格</label>
          <div class="font-options">
            <button
              v-for="font in fontOptions"
              :key="font.value"
              :class="[
                'font-btn',
                `font-preview-${font.value}`,
                { active: settings.font === font.value },
              ]"
              @click="settings.font = font.value"
            >
              {{ font.name }}
            </button>
          </div>
        </div>

        <!-- 悬浮模式 -->
        <div class="floating-controls">
          <div class="floating-btn-row">
            <button class="floating-btn" @click="openFloatingMode">
              <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-xuanfuwu"></use>
              </svg>
              开启悬浮模式
            </button>
            <!-- 悬浮窗设置按钮 -->
            <div class="float-settings-wrap" ref="floatSettingsRef">
              <button
                class="float-settings-btn"
                :class="{ active: showFloatingSettings }"
                @click.stop="showFloatingSettings = !showFloatingSettings"
                title="悬浮窗设置"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                  />
                </svg>
              </button>
              <!-- 气泡设置面板 -->
              <transition name="popover">
                <div
                  v-if="showFloatingSettings"
                  class="float-settings-popover"
                  @click.stop
                >
                  <div class="popover-arrow"></div>
                  <div class="popover-title">悬浮窗设置</div>
                  <div class="popover-row">
                    <span class="popover-label">不透明度</span>
                    <span class="popover-value"
                      >{{ Math.round(settings.floatingOpacity * 100) }}%</span
                    >
                  </div>
                  <input
                    type="range"
                    class="opacity-slider"
                    min="10"
                    max="100"
                    step="1"
                    :value="Math.round(settings.floatingOpacity * 100)"
                    :style="{
                      '--pct': Math.round(settings.floatingOpacity * 100),
                    }"
                    @input="onOpacityChange"
                  />
                  <div class="popover-hints">
                    <span>更透明</span>
                    <span>不透明</span>
                  </div>
                </div>
              </transition>
            </div>
          </div>
          <div class="option-row" style="margin-top: 0.75rem">
            <span
              class="option-label"
              style="font-size: 0.85rem; color: #444444"
              >悬浮窗始终置顶</span
            >
            <label class="toggle-switch">
              <input
                type="checkbox"
                v-model="settings.alwaysOnTop"
                @change="toggleAlwaysOnTop"
              />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  clampCountdownValue,
  formatCountdown,
  formatStopwatch,
} from "../utils/time";

export default {
  name: "MainPanel",
  data() {
    return {
      currentTime: "",
      currentDate: "",

      // Tab 状态
      activeTab: "clock",
      activeTabIndex: 0,
      prevTabIndex: 0,
      tabTransitionName: "slide-left",

      // 秒表
      stopwatchTime: 0,
      stopwatchRunning: false,
      stopwatchInterval: null,

      // 倒计时
      countdownHours: 0,
      countdownMinutes: 25,
      countdownSeconds: 0,
      countdownInitHours: 0,
      countdownInitMinutes: 25,
      countdownInitSeconds: 0,
      countdownRunning: false,
      countdownInterval: null,
      countdownMs: 0,
      countdownFinished: false,
      countdownEnding: false,
      // 倒计时结束时间戳。运行中按它计算剩余时间，避免首秒被完整算入倒计时。
      _cdEndAt: undefined,
      // 高频 RAF 句柄（秒表 & 时钟毫秒）
      _rafHandle: null,
      _msTick: 0,

      // 悬浮窗设置气泡
      showFloatingSettings: false,

      // 设置
      settings: {
        font: "Geometric",
        background: "gradient-1",
        alwaysOnTop: true,
        showDate: true,
        hour24: true,
        showMs: true,
        clockShowMs: false,
        countdownShowMs: false,
        floatingOpacity: 1,
        // 秒表内部精确起始时间戳（不存入持久化，仅运行时用）
      },

      tabs: [
        { id: "clock", name: "时钟" },
        { id: "stopwatch", name: "秒表" },
        { id: "countdown", name: "倒计时" },
      ],

      fontOptions: [
        { name: "圆润", value: "Rounded" },
        { name: "等线", value: "Mono" },
        { name: "衬线", value: "Serif" },
      ],

      backgroundOptions: [
        {
          value: "gradient-1",
          preview: "linear-gradient(135deg, #a8e6cf, #88d8c0)",
        },
        {
          value: "gradient-2",
          preview: "linear-gradient(135deg, #ffd3a5, #fd9853)",
        },
        {
          value: "gradient-3",
          preview: "linear-gradient(135deg, #a18cd1, #fbc2eb)",
        },
        {
          value: "gradient-4",
          preview: "linear-gradient(135deg, #84fab0, #8fd3f4)",
        },
        {
          value: "gradient-5",
          preview: "linear-gradient(135deg, #fa709a, #fee140)",
        },
      ],
    };
  },

  computed: {
    // 左侧面板背景随主题变化
    leftPanelStyle() {
      const map = {
        "gradient-1": "linear-gradient(135deg, #a8e6cf, #dcedc1)",
        "gradient-2": "linear-gradient(135deg, #ffd3a5, #ffe5c8)",
        "gradient-3": "linear-gradient(135deg, #c9b8f0, #fbc2eb)",
        "gradient-4": "linear-gradient(135deg, #84fab0, #b8eaf9)",
        "gradient-5": "linear-gradient(135deg, #fa709a, #ffd06f)",
      };
      return {
        background: map[this.settings.background] || map["gradient-1"],
      };
    },

    // 字体 class
    fontClass() {
      return `font-${this.settings.font}`;
    },

    // 时钟：纯时间部分（去掉 上午/下午 前缀）
    clockTimeOnly() {
      if (!this.settings.hour24) {
        // 12小时制：toLocaleTimeString 可能返回 "下午 02:30:05"，去掉前缀
        return this.currentTime.replace(/^(上午|下午|AM|PM)\s*/i, "").trim();
      }
      return this.currentTime;
    },

    // 上午 / 下午 标记（仅 12 小时制时有值）
    clockAmPm() {
      if (this.settings.hour24) return "";
      const match = this.currentTime.match(/^(上午|下午|AM|PM)/i);
      return match ? match[1] : "";
    },

    // 胶囊指示器位置
    indicatorStyle() {
      const w = 100 / this.tabs.length;
      return {
        width: `${w}%`,
        transform: `translateX(${this.activeTabIndex * 100}%)`,
      };
    },

    // 秒表显示 —— stopwatchTime 由 RAF 驱动，始终精确
    formattedStopwatch() {
      return formatStopwatch(this.stopwatchTime, this.settings.showMs);
    },

    // 时钟毫秒位（1位）—— 依赖 _msTick（由 RAF 驱动）触发响应式更新
    clockMs() {
      void this._msTick; // 建立响应式依赖
      return Math.floor((Date.now() % 1000) / 100);
    },

    // 带毫秒的时钟显示
    // 注意：时钟秒数来自 currentTime（1s 轮询），毫秒单独追加，两者独立互不干扰
    clockTimeOnlyWithMs() {
      if (this.settings.clockShowMs) {
        return `${this.clockTimeOnly}.${this.clockMs}`;
      }
      return this.clockTimeOnly;
    },

    // 倒计时显示
    formattedCountdown() {
      void this._msTick;
      return formatCountdown({
        hours: this.countdownHours,
        minutes: this.countdownMinutes,
        seconds: this.countdownSeconds,
        ms: this.countdownMs,
        showMs: this.settings.countdownShowMs,
        forceHours: this.countdownInitHours > 0 || this.countdownHours > 0,
      });
    },
  },

  mounted() {
    this.updateTime();
    setInterval(this.updateTime, 1000);
    // 启动 RAF 循环：驱动秒表精确计时 & 时钟/倒计时毫秒显示
    this.startRaf();
    this.loadSettings();
    this.listenFloatingActions();
    // 点击外部关闭气泡
    document.addEventListener("click", this.onDocClick);
  },

  beforeUnmount() {
    this.stopRaf();
    clearInterval(this.stopwatchInterval);
    clearInterval(this.countdownInterval);
    this.stopFloatingTick();
    document.removeEventListener("click", this.onDocClick);
    if (window.electronAPI && window.electronAPI.removeFloatingActionListener) {
      window.electronAPI.removeFloatingActionListener();
    }
  },

  methods: {
    // ── RAF 驱动循环 ──────────────────────────────
    startRaf() {
      const loop = () => {
        const now = Date.now();
        // 驱动 clockMs / countdownMs 等依赖 _msTick 的 computed
        this._msTick = now;
        // 秒表：运行中每帧更新，保证毫秒精确
        if (this.stopwatchRunning && this._swStart !== undefined) {
          this.stopwatchTime = now - this._swStart;
        }
        // 倒计时毫秒：运行中按真实经过时间计算
        if (this.countdownRunning && this._cdEndAt !== undefined) {
          // 使用结束时间戳推导剩余时间，启动瞬间就会进入下一秒段，
          const remainingMs = Math.max(0, this._cdEndAt - now);
          this.syncCountdownFromRemainingMs(remainingMs);

          if (remainingMs <= 0) {
            this.finishCountdown();
          }
        }
        this._rafHandle = requestAnimationFrame(loop);
      };
      this._rafHandle = requestAnimationFrame(loop);
    },

    stopRaf() {
      if (this._rafHandle) {
        cancelAnimationFrame(this._rafHandle);
        this._rafHandle = null;
      }
    },

    // ── 时间更新 ──────────────────────────────────
    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString("zh-CN", {
        hour12: !this.settings.hour24,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      this.currentDate = now.toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    },

    // ── 监听设置变化立即刷新时间 ──────────────────
    onHour24Change() {
      this.updateTime();
    },

    // ── Tab 切换 ──────────────────────────────────
    switchTab(id, index) {
      if (id === this.activeTab) return;
      this.tabTransitionName =
        index > this.activeTabIndex ? "slide-left" : "slide-right";
      this.prevTabIndex = this.activeTabIndex;
      this.activeTabIndex = index;
      this.activeTab = id;
    },

    // ── 秒表 ──────────────────────────────────────
    toggleStopwatch() {
      if (this.stopwatchRunning) {
        // 暂停：记录已累计时间，清除 RAF 起始点
        this.stopwatchTime = Date.now() - this._swStart;
        this._swStart = undefined;
        this.stopwatchRunning = false;
      } else {
        // 继续/开始：记录起始时间戳（已累计时间作偏移）
        this._swStart = Date.now() - this.stopwatchTime;
        this.stopwatchRunning = true;
      }
    },

    resetStopwatch() {
      this._swStart = undefined;
      this.stopwatchTime = 0;
      this.stopwatchRunning = false;
    },

    // ── 倒计时 ────────────────────────────────────
    toggleCountdown() {
      if (this.countdownRunning) {
        clearInterval(this.countdownInterval);
        // 暂停时把当前剩余时间固化到展示字段，便于后续继续计时。
        if (this._cdEndAt !== undefined) {
          const remainingMs = Math.max(0, this._cdEndAt - Date.now());
          this.syncCountdownFromRemainingMs(remainingMs);
        }
        this._cdEndAt = undefined;
        this.countdownRunning = false;
        return;
      }
      const total =
        this.countdownHours * 3600 +
        this.countdownMinutes * 60 +
        this.countdownSeconds;
      if (total <= 0) return;

      // 记录本次初始值，供 computed 判断是否展示小时
      this.countdownInitHours = this.countdownHours;
      this.countdownInitMinutes = this.countdownMinutes;
      this.countdownInitSeconds = this.countdownSeconds;
      this.countdownFinished = false;
      this.countdownEnding = false;
      this.countdownRunning = true;
      // 记录结束时间戳。展示值由 RAF 按剩余时间实时推导，避免首秒多算。
      this._cdEndAt = Date.now() + total * 1000;
      this.syncCountdownFromRemainingMs(total * 1000);
    },

    finishCountdown() {
      clearInterval(this.countdownInterval);
      this._cdEndAt = undefined;
      this._cdSecStart = undefined;
      this.countdownRunning = false;
      this.countdownFinished = true;
      this.countdownEnding = false;
      this.countdownMs = 0;
      this.countdownHours = 0;
      this.countdownMinutes = 0;
      this.countdownSeconds = 0;
    },

    resetCountdown() {
      clearInterval(this.countdownInterval);
      this._cdEndAt = undefined;
      this._cdSecStart = undefined;
      this.countdownRunning = false;
      this.countdownFinished = false;
      this.countdownEnding = false;
      this.countdownMs = 0;
      this.countdownHours = this.countdownInitHours;
      this.countdownMinutes = this.countdownInitMinutes;
      this.countdownSeconds = this.countdownInitSeconds;
    },

    syncCountdownFromRemainingMs(remainingMs) {
      // 倒计时展示按“剩余开区间”处理：
      // 刚点击开始时，05:00 会立刻进入 04:59.9，而不是额外显示完整一秒的 05:00.x。
      const normalizedMs = Math.max(0, remainingMs - 1);
      const totalSeconds = Math.floor(normalizedMs / 1000);

      this.countdownHours = Math.floor(totalSeconds / 3600);
      this.countdownMinutes = Math.floor((totalSeconds % 3600) / 60);
      this.countdownSeconds = totalSeconds % 60;
      this.countdownMs = normalizedMs % 1000;
      this.countdownEnding = totalSeconds < 10 && remainingMs > 0;
    },

    applyPreset(minutes) {
      if (this.countdownRunning) return;
      this.countdownHours = 0;
      this.countdownMinutes = minutes;
      this.countdownSeconds = 0;
      this.countdownInitHours = 0;
      this.countdownInitMinutes = minutes;
      this.countdownInitSeconds = 0;
      this.countdownFinished = false;
      this.countdownEnding = false;
    },

    clampCountdown() {
      this.countdownHours = clampCountdownValue(this.countdownHours, 99);
      this.countdownMinutes = clampCountdownValue(this.countdownMinutes, 59);
      this.countdownSeconds = clampCountdownValue(this.countdownSeconds, 59);
    },

    // ── 悬浮窗 ────────────────────────────────────
    async openFloatingMode() {
      await this.saveSettings();
      if (window.electronAPI) {
        // 打开悬浮窗时先发一份完整快照，确保它拿到一套可直接渲染的初始状态。
        const state = this.getFloatingStatePayload();
        window.electronAPI.openFloating(state);
        // 开始推送实时 tick 给悬浮窗
        this.startFloatingTick();
      }
    },

    getFloatingStatePayload() {
      // 这是“低频完整快照”，用于初始化悬浮窗，或在关键动作后整包校正状态。
      return JSON.parse(
        JSON.stringify({
          mode: this.activeTab,
          settings: this.settings,
          stopwatchTime: this.stopwatchTime,
          stopwatchRunning: this.stopwatchRunning,
          countdownHours: this.countdownHours,
          countdownMinutes: this.countdownMinutes,
          countdownSeconds: this.countdownSeconds,
          countdownInitHours: this.countdownInitHours,
          countdownInitMinutes: this.countdownInitMinutes,
          countdownInitSeconds: this.countdownInitSeconds,
          countdownRunning: this.countdownRunning,
          countdownFinished: this.countdownFinished,
          countdownEnding: this.countdownEnding,
          // 显式同步剩余时间基准，避免悬浮窗只拿到“当前秒数”却无法正确推进。
          countdownRemainingMs: this.getCountdownRemainingMs(),
        }),
      );
    },

    getFloatingTickPayload() {
      // 这是“高频增量数据”，只带悬浮窗实时显示所需的字段。
      return JSON.parse(
        JSON.stringify({
          mode: this.activeTab,
          stopwatchTime: this.stopwatchTime,
          stopwatchRunning: this.stopwatchRunning,
          stopwatchShowMs: this.settings.showMs,
          countdownHours: this.countdownHours,
          countdownMinutes: this.countdownMinutes,
          countdownSeconds: this.countdownSeconds,
          countdownInitHours: this.countdownInitHours,
          countdownInitMinutes: this.countdownInitMinutes,
          countdownInitSeconds: this.countdownInitSeconds,
          countdownMs: this.countdownMs,
          countdownShowMs: this.settings.countdownShowMs,
          countdownRunning: this.countdownRunning,
          countdownFinished: this.countdownFinished,
          countdownEnding: this.countdownEnding,
          // 高频通道同步剩余毫秒，悬浮窗据此在本地逐帧推导显示。
          countdownRemainingMs: this.getCountdownRemainingMs(),
          currentTime: this.currentTime,
          clockShowMs: this.settings.clockShowMs,
        }),
      );
    },

    // 统一导出倒计时剩余毫秒，保证主面板和悬浮窗基于同一时间基准。
    getCountdownRemainingMs() {
      if (this.countdownRunning && this._cdEndAt !== undefined) {
        return Math.max(0, this._cdEndAt - Date.now());
      }

      return Math.max(
        0,
        (this.countdownHours * 3600 +
          this.countdownMinutes * 60 +
          this.countdownSeconds) *
          1000 +
          this.countdownMs,
      );
    },

    pushFloatingSnapshot() {
      if (!window.electronAPI) return;
      // 动作刚发生时立即发一份快照 + 当前 tick，避免悬浮窗再等下一轮 80ms 定时推送。
      window.electronAPI.pushFloatingState(this.getFloatingStatePayload());
      window.electronAPI.pushTimerTick(this.getFloatingTickPayload());
    },

    // 开始向悬浮窗推送实时计时数据
    startFloatingTick() {
      this.stopFloatingTick();
      this._floatingTickInterval = setInterval(() => {
        if (!window.electronAPI) return;
        // 高频通道只做实时同步，不承担完整状态恢复职责。
        window.electronAPI.pushTimerTick(this.getFloatingTickPayload());
      }, 80);
    },

    stopFloatingTick() {
      if (this._floatingTickInterval) {
        clearInterval(this._floatingTickInterval);
        this._floatingTickInterval = null;
      }
    },

    // 监听悬浮窗发来的操作指令
    listenFloatingActions() {
      if (!window.electronAPI) return;
      if (typeof window.electronAPI.onFloatingAction !== "function") return;
      window.electronAPI.onFloatingAction((action) => {
        // 主面板仍然是计时状态的唯一来源。
        // 悬浮窗只负责上报动作，不直接决定最终业务状态。
        if (action === "stopwatch-toggle") this.toggleStopwatch();
        else if (action === "stopwatch-reset") this.resetStopwatch();
        else if (action === "countdown-toggle") this.toggleCountdown();
        else if (action === "countdown-reset") this.resetCountdown();
        else if (action === "close") this.stopFloatingTick();

        if (action !== "close") {
          this.pushFloatingSnapshot();
        }
      });
    },
    // 悬浮窗顶置设置变更时立即生效
    toggleAlwaysOnTop() {
      this.saveSettings();
      if (window.electronAPI)
        window.electronAPI.setAlwaysOnTop(!!this.settings.alwaysOnTop);
    },

    // 不透明度滑条变更
    onOpacityChange(e) {
      const val = Number(e.target.value) / 100;
      this.settings.floatingOpacity = val;
      if (window.electronAPI) window.electronAPI.setFloatingOpacity(val);
    },

    // 点击外部关闭气泡
    onDocClick(e) {
      const wrap = this.$refs.floatSettingsRef;
      if (wrap && !wrap.contains(e.target)) {
        this.showFloatingSettings = false;
      }
    },

    // ── 配置持久化 ────────────────────────────────
    async loadSettings() {
      if (window.electronAPI) {
        const saved = await window.electronAPI.getSettings();
        this.settings = { ...this.settings, ...saved };
      }
    },

    async saveSettings() {
      if (window.electronAPI) {
        // JSON 往返剥离 Vue Proxy，确保 IPC 结构化克隆可序列化
        const plain = JSON.parse(JSON.stringify(this.settings));
        await window.electronAPI.saveSettings(plain);
      }
    },
  },
};
</script>

<style scoped>
/* ────────────────────────────────────────────────
   布局
──────────────────────────────────────────────── */
.main-panel {
  display: flex;
  width: 100vw;
  height: 100vh;
  font-family:
    -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto,
    sans-serif;
  overflow: hidden;
  user-select: none;
}

/* ────────────────────────────────────────────────
   左侧展示区
──────────────────────────────────────────────── */
.left-panel {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #2c3e50;
  -webkit-app-region: drag;
  transition: background 0.6s ease;
  overflow: hidden;
}

.left-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.left-time {
  font-size: 5rem;
  font-weight: 700;
  letter-spacing: -3px;
  line-height: 1;
  color: #2c3e50;
  transition:
    font-family 0.3s ease,
    font-weight 0.3s ease,
    letter-spacing 0.3s ease;
}

.tabular {
  font-variant-numeric: tabular-nums;
}

/* ── 字体风格 ── */
/* 圆润：SF Pro Rounded / 系统圆体 fallback */
.font-Rounded {
  font-family:
    "SF Pro Rounded", "Apple SD Gothic Neo", "PingFang SC", ui-rounded,
    sans-serif;
  font-weight: 700;
  letter-spacing: -2px;
}

/* 等线（等宽/代码风） */
.font-Mono {
  font-family:
    "SF Mono", "JetBrains Mono", "Fira Code", "Courier New", monospace;
  font-weight: 600;
  letter-spacing: 2px;
}

/* 衬线 */
.font-Serif {
  font-family: "Georgia", "Times New Roman", "Songti SC", "SimSun", serif;
  font-weight: 700;
  letter-spacing: -1px;
  font-style: italic;
}

.sw-time {
  font-size: 4rem;
  letter-spacing: -2px;
}

.cd-time {
  font-size: 4.5rem;
  letter-spacing: -2px;
  transition: color 0.3s;
}

.cd-ending {
  color: #e74c3c;
  animation: pulse 0.8s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

.left-date,
.left-sub {
  font-size: 1.1rem;
  opacity: 0.7;
  font-weight: 400;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.ampm-tag {
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  padding: 1px 7px;
  letter-spacing: 0.5px;
  opacity: 1;
  flex-shrink: 0;
}

/* 左侧切换过渡 */
.left-fade-enter-active,
.left-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.left-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.left-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* ────────────────────────────────────────────────
   右侧控制区
──────────────────────────────────────────────── */
.right-panel {
  flex: 0.8;
  max-width: 400px;
  min-width: 320px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border-left: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.06);
  padding: 2rem 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  -webkit-app-region: no-drag;
  overflow-y: auto;
}

/* ────────────────────────────────────────────────
   胶囊 Tab
──────────────────────────────────────────────── */
.capsule-tab-wrapper {
  margin-bottom: 1.75rem;
}

.capsule-track {
  position: relative;
  display: flex;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 50px;
  padding: 4px;
  gap: 0;
  overflow: hidden;
}

/* 滑动指示器 */
.capsule-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  height: calc(100% - 8px);
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.12),
    0 1px 4px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.38s cubic-bezier(0.34, 1.3, 0.64, 1),
    width 0.38s cubic-bezier(0.34, 1.3, 0.64, 1);
  /* width 由 JS 控制，这里只做过渡 */
  pointer-events: none;
  z-index: 0;
}

.capsule-btn {
  flex: 1;
  position: relative;
  z-index: 1;
  padding: 0.55rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 50px;
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(80, 80, 80, 0.75);
  cursor: pointer;
  transition: color 0.28s ease;
  white-space: nowrap;
}

.capsule-btn.active {
  color: #2c3e50;
}

/* ────────────────────────────────────────────────
   右侧内容区切换动画
──────────────────────────────────────────────── */
.right-content-area {
  flex: 1;
  min-height: 220px;
  overflow: hidden;
  position: relative;
}

/* 向左滑（下一个） */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

.slide-left-enter-to,
.slide-left-leave-from,
.slide-right-enter-to,
.slide-right-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* ────────────────────────────────────────────────
   面板通用
──────────────────────────────────────────────── */
.panel-section {
  padding-top: 0.25rem;
}

.panel-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1.4rem;
  letter-spacing: 0.2px;
}

/* option 行（label + toggle） */
.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0;
}

.option-label {
  font-size: 0.92rem;
  color: #444;
  font-weight: 400;
}

/* ────────────────────────────────────────────────
   Toggle 开关
──────────────────────────────────────────────── */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 24px;
  transition: background 0.28s ease;
}

.slider::before {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  background: white;
  border-radius: 50%;
  transition: transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .slider {
  background: #4facfe;
}

.toggle-switch input:checked + .slider::before {
  transform: translateX(20px);
}

/* ────────────────────────────────────────────────
   倒计时输入
──────────────────────────────────────────────── */
.time-input-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0.5rem 0 1.5rem;
  gap: 8px;
}

.time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.time-unit label {
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(80, 80, 80, 0.6);
  letter-spacing: 0.5px;
}

.time-unit input {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.55);
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  text-align: center;
  font-size: 1.85rem;
  font-family:
    "SF Pro Display",
    -apple-system,
    sans-serif;
  font-variant-numeric: tabular-nums;
  color: #2c3e50;
  outline: none;
  transition:
    background 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
  -moz-appearance: textfield;
  appearance: none;
  font-weight: 500;
}

.time-unit input::-webkit-outer-spin-button,
.time-unit input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.time-unit input:focus {
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 0 3.5px rgba(79, 172, 254, 0.25);
  border-color: #4facfe;
}

.time-unit input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.colon {
  font-size: 1.8rem;
  font-weight: 300;
  color: #2c3e50;
  opacity: 0.5;
  margin-top: 18px;
  line-height: 1;
}

/* ────────────────────────────────────────────────
   控制按钮
──────────────────────────────────────────────── */
.control-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.25rem;
}

/* 毫秒切换小按钮 */
.ms-toggle-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
  height: 34px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.4);
  color: rgba(80, 80, 80, 0.5);
  cursor: pointer;
  transition: all 0.22s ease;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
}

.ms-toggle-btn svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.ms-label {
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
  line-height: 1;
}

.ms-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.7);
  color: rgba(60, 60, 60, 0.75);
  border-color: rgba(0, 0, 0, 0.18);
}

.ms-toggle-btn.active {
  background: rgba(79, 172, 254, 0.15);
  color: #2980b9;
  border-color: rgba(79, 172, 254, 0.4);
}

.ctrl-btn {
  padding: 0.65rem 1.75rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;
}

.ctrl-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.13);
}

.ctrl-btn:active {
  transform: translateY(0);
}

.btn-start {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: white;
}

.btn-pause {
  background: linear-gradient(135deg, #f7971e, #ffd200);
  color: white;
}

.btn-reset {
  background: rgba(255, 255, 255, 0.85);
  color: #555;
}

/* ────────────────────────────────────────────────
   番茄钟预设 Chips
──────────────────────────────────────────────── */
.preset-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.25rem;
}

.chip {
  padding: 5px 13px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  font-size: 0.82rem;
  color: #555;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.chip:hover {
  background: rgba(255, 255, 255, 0.75);
  transform: translateY(-1px);
}

/* ────────────────────────────────────────────────
   底部设置区
──────────────────────────────────────────────── */
.settings-section {
  margin-top: auto;
  padding-top: 1.25rem;
}

.settings-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.35);
  margin-bottom: 1.25rem;
}

.setting-group {
  margin-bottom: 1.1rem;
}

.setting-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(44, 62, 80, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 0.6rem;
}

/* 背景色块 */
.background-options {
  display: flex;
  gap: 0.5rem;
}

.bg-option {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  border: 2.5px solid transparent;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease;
}

.bg-option.active {
  border-color: rgba(79, 172, 254, 0.9);
  transform: scale(1.12);
}

.bg-option:hover:not(.active) {
  transform: scale(1.06);
}

/* 字体按钮 */
.font-options {
  display: flex;
  gap: 0.4rem;
}

.font-btn {
  flex: 1;
  padding: 0.45rem 0.25rem;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  color: #666;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition:
    background 0.25s ease,
    color 0.25s ease;
}

.font-btn.active {
  background: rgba(255, 255, 255, 0.92);
  color: #2c3e50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* ────────────────────────────────────────────────
   悬浮模式控制
──────────────────────────────────────────────── */
.floating-controls {
  margin-top: 0.25rem;
}

.floating-btn-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.floating-btn {
  flex: 1;
  padding: 0.85rem 1.5rem;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #46e5d9, #007be8);
  color: white;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  letter-spacing: 0.3px;
}

.floating-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.38);
}

.floating-btn:active {
  transform: translateY(0);
}

/* ── 悬浮窗设置圆形按钮 ── */
.float-settings-wrap {
  position: relative;
  flex-shrink: 0;
}

.float-settings-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(10px);
  color: rgba(60, 80, 100, 0.65);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.22s ease,
    color 0.22s ease,
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.float-settings-btn svg {
  width: 16px;
  height: 16px;
}

.float-settings-btn:hover {
  background: rgba(255, 255, 255, 0.7);
  color: #2c3e50;
  transform: rotate(30deg);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}

.float-settings-btn.active {
  background: rgba(79, 172, 254, 0.15);
  color: #2176ae;
  border-color: rgba(79, 172, 254, 0.4);
  transform: rotate(60deg);
}

/* ── 气泡设置面板 ── */
.float-settings-popover {
  position: absolute;
  bottom: calc(100% + 10px);
  right: 0;
  width: 220px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow:
    0 12px 36px rgba(0, 0, 0, 0.13),
    0 3px 10px rgba(0, 0, 0, 0.07);
  padding: 14px 16px 16px;
  z-index: 100;
}

.popover-arrow {
  position: absolute;
  bottom: -6px;
  right: 15px;
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.82);
  border-right: 1px solid rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.6);
  transform: rotate(45deg);
}

.popover-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(44, 62, 80, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 12px;
}

.popover-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.popover-label {
  font-size: 0.88rem;
  color: #2c3e50;
  font-weight: 500;
}

.popover-value {
  font-size: 0.82rem;
  font-weight: 700;
  color: #4facfe;
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: right;
}

.opacity-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(
    to right,
    #4facfe 0%,
    #4facfe calc(var(--pct, 100%) * 1%),
    rgba(0, 0, 0, 0.1) calc(var(--pct, 100%) * 1%),
    rgba(0, 0, 0, 0.1) 100%
  );
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}

.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  border: 2px solid #4facfe;
  box-shadow: 0 2px 8px rgba(79, 172, 254, 0.35);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.opacity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.popover-hints {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 0.72rem;
  color: rgba(80, 80, 80, 0.45);
}

/* 气泡弹出动画 */
.popover-enter-active,
.popover-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}

/* 时钟面板 options */
.clock-options {
  display: flex;
  flex-direction: column;
}

/* 字体按钮预览样式 */
.font-preview-Rounded {
  font-family: "SF Pro Rounded", ui-rounded, "PingFang SC", sans-serif;
  font-weight: 700;
}

.font-preview-Mono {
  font-family: "SF Mono", "JetBrains Mono", "Fira Code", monospace;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.font-preview-Serif {
  font-family: "Georgia", "Times New Roman", serif;
  font-style: italic;
  font-weight: 700;
}
</style>
