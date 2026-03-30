<template>
  <div class="floating-root">
    <div class="capsule">
      <!-- 顶部拖拽指示条 -->
      <div class="drag-bar"></div>

      <!-- 顶部操作栏：关闭 + 展开 -->
      <div class="top-bar">
        <button class="icon-btn close-btn" @click="handleClose" title="关闭">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
        <button
          class="icon-btn expand-btn"
          @click="handleExpand"
          title="返回主面板"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>

      <!-- ── 时钟模式 ── -->
      <div v-if="mode === 'clock'" class="content content--clock">
        <span class="time-display" :class="fontClass">{{
          clockDisplayTime
        }}</span>
      </div>

      <!-- ── 秒表模式 ── -->
      <div v-else-if="mode === 'stopwatch'" class="content content--timer">
        <span class="time-display time-display--timer" :class="fontClass">{{
          formattedStopwatch
        }}</span>
        <div class="timer-actions">
          <!-- 重置 -->
          <button
            class="icon-btn action-btn"
            @click="handleAction('stopwatch-reset')"
            title="重置"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
            </svg>
          </button>
          <!-- 开始 / 暂停 -->
          <button
            class="icon-btn action-btn action-btn--primary"
            :class="{ 'action-btn--pause': stopwatchRunning }"
            @click="handleAction('stopwatch-toggle')"
            :title="stopwatchRunning ? '暂停' : '开始'"
          >
            <svg
              v-if="!stopwatchRunning"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="6,4 20,12 6,20" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      <!-- ── 倒计时模式 ── -->
      <div v-else-if="mode === 'countdown'" class="content content--timer">
        <span
          class="time-display time-display--timer"
          :class="[
            fontClass,
            {
              'time-display--ending': countdownEnding,
              'time-display--finished': countdownFinished,
            },
          ]"
          >{{ formattedCountdown }}</span
        >
        <div class="timer-actions">
          <!-- 重置 -->
          <button
            class="icon-btn action-btn"
            @click="handleAction('countdown-reset')"
            title="重置"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
            </svg>
          </button>
          <!-- 开始 / 暂停 -->
          <button
            class="icon-btn action-btn action-btn--primary"
            :class="{ 'action-btn--pause': countdownRunning }"
            @click="handleAction('countdown-toggle')"
            :title="countdownRunning ? '暂停' : '开始'"
            :disabled="countdownFinished"
          >
            <svg
              v-if="!countdownRunning"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="6,4 20,12 6,20" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatCountdown, formatStopwatch } from "../utils/time";

export default {
  name: "FloatingWindow",

  data() {
    return {
      // 模式：'clock' | 'stopwatch' | 'countdown'
      mode: "clock",

      // 设置
      settings: {
        font: "Rounded",
        background: "gradient-1",
        hour24: true,
        showMs: true,
        countdownShowMs: false,
        clockShowMs: false,
      },

      // 时钟
      currentTime: "",
      clockInterval: null,

      // 秒表（stopwatchTime 由本地 RAF 精确驱动）
      stopwatchTime: 0,
      stopwatchRunning: false,
      _swStart: undefined, // RAF 起始时间戳

      // 倒计时（秒由 tick 同步，毫秒由本地 RAF 驱动）
      countdownHours: 0,
      countdownMinutes: 0,
      countdownSeconds: 0,
      countdownRunning: false,
      countdownFinished: false,
      countdownEnding: false,
      _cdSecStart: undefined, // 当前秒段起始时间戳
      _cdMs: 0, // 当前秒内已过毫秒数（RAF驱动）

      // RAF 驱动
      _rafHandle: null,
      _rafTick: 0, // 响应式触发器
    };
  },

  computed: {
    isTimerMode() {
      return this.mode === "stopwatch" || this.mode === "countdown";
    },

    fontClass() {
      return `font-${this.settings.font}`;
    },

    // 时钟展示字符串：纯时间 + 可选1位毫秒，完全由本地独立计时驱动
    clockDisplayTime() {
      void this._rafTick; // 建立响应式依赖，每帧刷新
      if (this.settings.clockShowMs) {
        const c = Math.floor((Date.now() % 1000) / 100);
        return `${this.currentTime}.${c}`;
      }
      return this.currentTime;
    },

    // 秒表格式化 —— stopwatchTime 由 RAF 驱动，1位毫秒
    formattedStopwatch() {
      void this._rafTick; // 建立响应式依赖
      return formatStopwatch(this.stopwatchTime, this.settings.showMs);
    },

    // 倒计时格式化 —— 毫秒由 RAF 驱动，始终显示（开关控制）
    formattedCountdown() {
      void this._rafTick; // 建立响应式依赖
      return formatCountdown({
        hours: this.countdownHours,
        minutes: this.countdownMinutes,
        seconds: this.countdownSeconds,
        ms: this._cdMs,
        showMs: this.settings.countdownShowMs,
        forceHours: this.countdownHours > 0,
      });
    },
  },

  async mounted() {
    await this.loadInitialState();
    this.startClockIfNeeded();
    this.startRaf();
    this.subscribeToTicks();
    this.subscribeToStateUpdates();
  },

  beforeUnmount() {
    this.stopClock();
    this.stopRaf();
    if (window.electronAPI) {
      window.electronAPI.removeTimerTickListener();
      window.electronAPI.removeStateUpdateListener();
    }
  },

  methods: {
    // ── 初始化 ────────────────────────────────────
    async loadInitialState() {
      if (!window.electronAPI) return;

      // 读取初始状态（主面板在开启悬浮前推送到主进程缓存）
      const state = await window.electronAPI.getFloatingState();
      if (!state) return;

      this.applyState(state);
    },

    applyState(state) {
      if (state.mode) this.mode = state.mode;
      if (state.settings) {
        this.settings = { ...this.settings, ...state.settings };
      }

      // 这里处理的是“权威状态”同步。
      // 悬浮窗可以先做本地乐观更新，但最终仍以主面板推回的状态为准。
      // 秒表：同步累计时间，重建 RAF 起始点
      if (state.stopwatchTime !== undefined) {
        this.stopwatchTime = state.stopwatchTime;
      }
      if (state.stopwatchRunning !== undefined) {
        const wasRunning = this.stopwatchRunning;
        this.stopwatchRunning = state.stopwatchRunning;
        if (state.stopwatchRunning && !wasRunning) {
          // 刚开始运行：用当前时间减去已累计量作为起始点
          this._swStart = Date.now() - this.stopwatchTime;
        } else if (!state.stopwatchRunning) {
          this._swStart = undefined;
        }
      }

      // 倒计时
      if (state.countdownHours !== undefined)
        this.countdownHours = state.countdownHours;
      if (state.countdownMinutes !== undefined)
        this.countdownMinutes = state.countdownMinutes;
      if (state.countdownSeconds !== undefined)
        this.countdownSeconds = state.countdownSeconds;
      if (state.countdownRunning !== undefined) {
        const wasRunning = this.countdownRunning;
        this.countdownRunning = state.countdownRunning;
        if (state.countdownRunning && !wasRunning) {
          this._cdSecStart = Date.now();
          this._cdMs = 0;
        } else if (!state.countdownRunning) {
          this._cdSecStart = undefined;
          this._cdMs = 0;
        }
      }
      if (state.countdownFinished !== undefined)
        this.countdownFinished = state.countdownFinished;
      if (state.countdownEnding !== undefined)
        this.countdownEnding = state.countdownEnding;
    },

    // ── RAF 驱动循环 ──────────────────────────────
    startRaf() {
      const loop = () => {
        const now = Date.now();
        // 触发所有依赖 _rafTick 的 computed 重新计算
        this._rafTick = now;

        // 悬浮窗不依赖主面板高频推送来逐帧刷新时间。
        // 这样可以把 IPC 只用于“状态校正”，把高频重绘留在本地完成。
        // 秒表：运行中每帧精确更新
        if (this.stopwatchRunning && this._swStart !== undefined) {
          this.stopwatchTime = now - this._swStart;
        }

        // 倒计时毫秒：运行中按真实经过时间计算（0→999方向）
        if (this.countdownRunning && this._cdSecStart !== undefined) {
          this._cdMs = (now - this._cdSecStart) % 1000;
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

    // ── 时钟 ──────────────────────────────────────
    // 悬浮窗时钟完全独立计时，不依赖 tick，彻底避免跳秒
    startClockIfNeeded() {
      this.updateClock();
      // 对齐到下一个整秒再开始 1s interval，减少偏差
      const msToNextSec = 1000 - (Date.now() % 1000);
      setTimeout(() => {
        this.updateClock();
        this.clockInterval = setInterval(this.updateClock, 1000);
      }, msToNextSec);
    },

    stopClock() {
      if (this.clockInterval) {
        clearInterval(this.clockInterval);
        this.clockInterval = null;
      }
    },

    updateClock() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("zh-CN", {
        hour12: !this.settings.hour24,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      // 去掉上午/下午前缀
      this.currentTime = timeStr.replace(/^(上午|下午|AM|PM)\s*/i, "").trim();
      // 毫秒由 RAF + _rafTick 驱动，clockShowMs 时追加
    },

    // ── 订阅主面板实时 tick ───────────────────────
    // tick 只用于同步秒表/倒计时的离散状态（秒数、运行标志等）
    // 不再用 tick 更新时钟字符串，避免跳秒
    subscribeToTicks() {
      if (!window.electronAPI) return;
      window.electronAPI.onTimerTick((data) => {
        if (!data) return;

        // tick 是轻量的高频同步通道，主要负责“运行中会变化的字段”。
        // 配置、模式等低频数据则走 state-update 快照。
        // 同步设置（毫秒开关等）
        if (data.stopwatchShowMs !== undefined)
          this.settings.showMs = data.stopwatchShowMs;
        if (data.countdownShowMs !== undefined)
          this.settings.countdownShowMs = data.countdownShowMs;
        if (data.clockShowMs !== undefined)
          this.settings.clockShowMs = data.clockShowMs;

        // 秒表：只在状态变化时才同步（避免每帧都覆盖 RAF 计算的精确值）
        if (data.stopwatchRunning !== undefined) {
          const wasRunning = this.stopwatchRunning;
          this.stopwatchRunning = data.stopwatchRunning;

          if (!data.stopwatchRunning) {
            // 暂停/重置：用主面板的精确值覆盖
            if (data.stopwatchTime !== undefined) {
              this.stopwatchTime = data.stopwatchTime;
            }
            this._swStart = undefined;
          } else if (!wasRunning && data.stopwatchRunning) {
            // 刚开始：重建本地 RAF 起始点
            if (data.stopwatchTime !== undefined) {
              this.stopwatchTime = data.stopwatchTime;
            }
            this._swStart = Date.now() - this.stopwatchTime;
          }
          // 运行中：RAF 自己计算，不接受 tick 覆盖 stopwatchTime
        }

        // 倒计时：只同步秒级状态变化
        const cdSecsChanged =
          data.countdownHours !== undefined &&
          (data.countdownHours !== this.countdownHours ||
            data.countdownMinutes !== this.countdownMinutes ||
            data.countdownSeconds !== this.countdownSeconds);

        if (data.countdownHours !== undefined)
          this.countdownHours = data.countdownHours;
        if (data.countdownMinutes !== undefined)
          this.countdownMinutes = data.countdownMinutes;
        if (data.countdownSeconds !== undefined)
          this.countdownSeconds = data.countdownSeconds;

        if (data.countdownRunning !== undefined) {
          const wasRunning = this.countdownRunning;
          this.countdownRunning = data.countdownRunning;
          if (!wasRunning && data.countdownRunning) {
            // 刚开始
            this._cdSecStart = Date.now();
            this._cdMs = 0;
          } else if (!data.countdownRunning) {
            this._cdSecStart = undefined;
            this._cdMs = 0;
          }
        }

        // 每次秒数跳变时重置毫秒段
        if (cdSecsChanged && this.countdownRunning) {
          this._cdSecStart = Date.now();
          this._cdMs = 0;
        }

        if (data.countdownFinished !== undefined)
          this.countdownFinished = data.countdownFinished;
        if (data.countdownEnding !== undefined)
          this.countdownEnding = data.countdownEnding;
      });
    },

    // ── 订阅状态变化（如设置更改）────────────────
    subscribeToStateUpdates() {
      if (!window.electronAPI) return;
      window.electronAPI.onStateUpdate((state) => {
        this.applyState(state);
      });
    },

    // ── 按钮操作 ──────────────────────────────────
    // 点击后先做本地更新，再把动作上报主面板。
    // 这样按钮和数字能立即响应，不必等待一次 IPC 往返。
    handleAction(action) {
      if (!window.electronAPI) return;
      this.applyOptimisticAction(action);
      window.electronAPI.floatingAction(action);
    },

    // 本地乐观更新只覆盖用户操作的第一帧反馈。
    // 如果主面板最终状态与这里不一致，后续 tick/state-update 会把它校正回来。
    applyOptimisticAction(action) {
      const now = Date.now();

      if (action === "stopwatch-toggle") {
        if (this.stopwatchRunning) {
          if (this._swStart !== undefined) {
            this.stopwatchTime = now - this._swStart;
          }
          this._swStart = undefined;
          this.stopwatchRunning = false;
          return;
        }

        this._swStart = now - this.stopwatchTime;
        this.stopwatchRunning = true;
        return;
      }

      if (action === "stopwatch-reset") {
        this._swStart = undefined;
        this.stopwatchTime = 0;
        this.stopwatchRunning = false;
        return;
      }

      if (action === "countdown-toggle") {
        if (this.countdownRunning) {
          this.countdownRunning = false;
          this._cdSecStart = undefined;
          this._cdMs = 0;
          return;
        }

        if (
          this.countdownFinished ||
          (this.countdownHours === 0 &&
            this.countdownMinutes === 0 &&
            this.countdownSeconds === 0)
        ) {
          return;
        }

        this.countdownRunning = true;
        this._cdSecStart = now;
        this._cdMs = 0;
        return;
      }

      if (action === "countdown-reset") {
        this.countdownRunning = false;
        this.countdownFinished = false;
        this.countdownEnding = false;
        this._cdSecStart = undefined;
        this._cdMs = 0;
      }
    },

    handleClose() {
      if (window.electronAPI) window.electronAPI.closeFloating();
    },

    handleExpand() {
      if (window.electronAPI) window.electronAPI.closeFloating();
    },
  },
};
</script>

<style scoped>
/* ── 根容器：透明全屏 ── */
.floating-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  -webkit-app-region: drag;
}

/* ── 胶囊主体：竖向布局，三种模式统一尺寸 ── */
.capsule {
  position: relative;
  /* 竖向：时间居上，按钮居下 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;

  /* 三种模式统一宽高 */
  width: 280px;
  height: 120px;

  /* 玻璃拟态 */
  background: rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(36px) saturate(200%);
  -webkit-backdrop-filter: blur(36px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.13),
    0 3px 10px rgba(0, 0, 0, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);

  border-radius: 32px;
  padding: 14px 18px 12px;
  box-sizing: border-box;
}

/* ── 顶部拖拽指示条 ── */
.drag-bar {
  position: absolute;
  top: 7px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 3px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.12);
  pointer-events: none;
}

/* ── 顶部操作栏（关闭 + 展开，两端对齐）── */
.top-bar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  -webkit-app-region: no-drag;
}

/* ── 公共图标按钮 ── */
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: rgba(44, 62, 80, 0.45);
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.18s ease;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.07);
  color: rgba(44, 62, 80, 0.85);
  transform: scale(1.1);
}

.icon-btn:active {
  transform: scale(0.95);
}

.icon-btn svg {
  display: block;
}

/* ── 关闭 & 展开按钮尺寸 ── */
.close-btn,
.expand-btn {
  width: 22px;
  height: 22px;
}

.close-btn svg,
.expand-btn svg {
  width: 11px;
  height: 11px;
}

.close-btn:hover {
  background: rgba(231, 76, 60, 0.12);
  color: #e74c3c;
}

.expand-btn:hover {
  background: rgba(79, 172, 254, 0.12);
  color: #4facfe;
}

/* ── 内容区域（时间 + 可选按钮，居中竖排）── */
.content {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  -webkit-app-region: drag;
}

.content--clock {
  /* 时钟无按钮，时间垂直居中 */
  justify-content: center;
}

.content--timer {
  justify-content: center;
}

/* ── 时间数字 ── */
.time-display {
  font-size: 2.2rem;
  font-weight: 700;
  color: #1a2a3a;
  letter-spacing: -1.5px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transition: color 0.3s ease;
  -webkit-app-region: drag;
}

.time-display--timer {
  font-size: 2rem;
  letter-spacing: -1px;
}

/* 最后 10 秒闪烁 */
.time-display--ending {
  color: #e74c3c;
  animation: pulse 0.8s ease-in-out infinite;
}

/* 时间到 */
.time-display--finished {
  color: #27ae60;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

/* ── 计时操作按钮组（时间正下方，横排居中）── */
.timer-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  -webkit-app-region: no-drag;
}

/* 操作按钮圆形 */
.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

/* 重置按钮 */
.action-btn:not(.action-btn--primary) {
  color: rgba(44, 62, 80, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.5);
}

.action-btn:not(.action-btn--primary):hover {
  background: rgba(255, 255, 255, 0.85);
  color: rgba(44, 62, 80, 0.8);
  border-color: rgba(0, 0, 0, 0.14);
}

/* 开始按钮（蓝色）*/
.action-btn--primary {
  background: rgba(79, 172, 254, 0.2);
  color: #2176ae;
  border: 1px solid rgba(79, 172, 254, 0.3);
}

.action-btn--primary:hover {
  background: rgba(79, 172, 254, 0.35);
  color: #1560a0;
  border-color: rgba(79, 172, 254, 0.5);
}

/* 暂停状态：橙色 */
.action-btn--pause {
  background: rgba(247, 151, 30, 0.18);
  color: #c8790f;
  border: 1px solid rgba(247, 151, 30, 0.3);
}

.action-btn--pause:hover {
  background: rgba(247, 151, 30, 0.32);
  color: #a86409;
  border-color: rgba(247, 151, 30, 0.45);
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none !important;
}

/* ── 字体风格 ── */
.font-Rounded {
  font-family:
    "SF Pro Rounded", "Apple SD Gothic Neo", "PingFang SC", ui-rounded,
    sans-serif;
  font-weight: 700;
}

.font-Mono {
  font-family:
    "SF Mono", "JetBrains Mono", "Fira Code", "Courier New", monospace;
  font-weight: 600;
  letter-spacing: 1px;
}

.font-Serif {
  font-family: "Georgia", "Times New Roman", "Songti SC", serif;
  font-weight: 700;
  font-style: italic;
}
</style>
