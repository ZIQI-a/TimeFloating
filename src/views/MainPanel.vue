<template>
  <div class="main-panel">
    <!-- 左侧时间显示区 -->
    <div class="left-panel">
      <div class="time-display">
        <div class="current-time">{{ currentTime }}</div>
        <div class="date-info">{{ currentDate }}</div>
      </div>
    </div>

    <!-- 右侧控制区 -->
    <div class="right-panel">
      <!-- 功能切换标签 -->
      <div class="tab-container">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- 功能内容区 -->
<!-- 替换原有的 <div v-if="activeTab === 'countdown'" ...> 块 -->
<div v-if="activeTab === 'countdown'" class="countdown-mode">
  <div class="mode-title">倒计时 / 番茄钟</div>
  
  <!-- 时间显示/输入区 -->
  <div class="time-input-container">
    <div class="time-unit">
      <label>H</label>
      <input v-model.number="countdownHours" type="number" min="0" max="99" placeholder="00" :disabled="countdownRunning">
    </div>
    <span class="colon">:</span>
    <div class="time-unit">
      <label>M</label>
      <input v-model.number="countdownMinutes" type="number" min="0" max="59" placeholder="00" :disabled="countdownRunning">
    </div>
    <span class="colon">:</span>
    <div class="time-unit">
      <label>S</label>
      <input v-model.number="countdownSeconds" type="number" min="0" max="59" placeholder="00" :disabled="countdownRunning">
    </div>
  </div>

  <!-- 控制按钮组 -->
  <div class="control-buttons">
    <button class="control-btn start" @click="toggleCountdown">
      {{ countdownRunning ? '⏸ 暂停' : '▶ 开始' }}
    </button>
    <button class="control-btn reset" @click="resetCountdown">
      ↺ 重置
    </button>
  </div>
  
  <!-- 快捷预设 (番茄钟) -->
  <div class="preset-chips">
    <button class="chip" @click="applyPreset(25)">🍅 25分钟</button>
    <button class="chip" @click="applyPreset(5)">☕ 5分钟</button>
    <button class="chip" @click="applyPreset(10)">🧘 10分钟</button>
  </div>
</div>

      <!-- 自定义设置区 -->
      <div class="settings-section">
        <!-- 字体设置 -->
        <div class="setting-group">
          <label>字体</label>
          <div class="font-options">
            <button 
              v-for="font in fontOptions" 
              :key="font.value"
              :class="['font-btn', { active: settings.font === font.value }]"
              @click="settings.font = font.value"
            >
              {{ font.name }}
            </button>
          </div>
        </div>

        <!-- 背景设置 -->
        <div class="setting-group">
          <label>背景</label>
          <div class="background-options">
            <div 
              v-for="bg in backgroundOptions" 
              :key="bg.value"
              :class="['bg-option', { active: settings.background === bg.value }]"
              :style="{ background: bg.preview }"
              @click="settings.background = bg.value"
            ></div>
          </div>
        </div>

        <!-- 悬浮模式按钮 -->
        <div class="floating-controls">
          <button class="floating-btn" @click="openFloatingMode">
            🚀 开启悬浮模式
          </button>
          <div class="toggle-group">
            <label>
              <input type="checkbox" v-model="settings.alwaysOnTop" @change="toggleAlwaysOnTop">
              贴顶模式
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainPanel',
  data() {
    return {
      currentTime: '',
      currentDate: '',
      activeTab: 'countdown',
      
      // 秒表相关
      stopwatchTime: 0,
      stopwatchRunning: false,
      stopwatchInterval: null,
      
      // 倒计时相关
      countdownHours: 0,
      countdownMinutes: 25,
      countdownSeconds: 0,
      countdownRunning: false,
      countdownInterval: null,
      selectedPreset: '',
      
      // 设置
      settings: {
        font: 'Geometric',
        background: 'gradient-1',
        alwaysOnTop: true
      },
      
      tabs: [
        { id: 'clock', name: '时钟' },
        { id: 'stopwatch', name: '秒表' },
        { id: 'countdown', name: '倒计时' }
      ],
      
      fontOptions: [
        { name: 'Geometric', value: 'Geometric' },
        { name: 'Dot Matrix', value: 'DotMatrix' },
        { name: '系统字体', value: 'System' }
      ],
      
      backgroundOptions: [
        { value: 'gradient-1', preview: 'linear-gradient(135deg, #a8e6cf, #88d8c0)' },
        { value: 'gradient-2', preview: 'linear-gradient(135deg, #ffd3a5, #fd9853)' },
        { value: 'gradient-3', preview: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
        { value: 'gradient-4', preview: 'linear-gradient(135deg, #84fab0, #8fd3f4)' },
        { value: 'gradient-5', preview: 'linear-gradient(135deg, #fa709a, #fee140)' }
      ]
    }
  },
  
  mounted() {
    this.updateTime();
    setInterval(this.updateTime, 1000);
    this.loadSettings();
  },
  
  methods: {
    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString('zh-CN', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      this.currentDate = now.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    },
    
    // 秒表功能
    toggleStopwatch() {
      if (this.stopwatchRunning) {
        clearInterval(this.stopwatchInterval);
      } else {
        this.stopwatchInterval = setInterval(() => {
          this.stopwatchTime += 10;
        }, 10);
      }
      this.stopwatchRunning = !this.stopwatchRunning;
    },
    
    resetStopwatch() {
      clearInterval(this.stopwatchInterval);
      this.stopwatchTime = 0;
      this.stopwatchRunning = false;
    },
    
    // 倒计时功能
    toggleCountdown() {
        if (this.countdownRunning) {
    // 暂停
    clearInterval(this.countdownInterval);
    this.countdownRunning = false;
  } else {
    // 开始
    // 先检查是否有时间
    const totalSeconds = this.countdownHours * 3600 + this.countdownMinutes * 60 + this.countdownSeconds;
    if (totalSeconds <= 0) return;

    this.countdownRunning = true;
    this.countdownInterval = setInterval(() => {
      if (this.countdownSeconds > 0) {
        this.countdownSeconds--;
      } else if (this.countdownMinutes > 0) {
        this.countdownMinutes--;
        this.countdownSeconds = 59;
      } else if (this.countdownHours > 0) {
        this.countdownHours--;
        this.countdownMinutes = 59;
        this.countdownSeconds = 59;
      } else {
        // 倒计时结束
        this.resetCountdown();
        this.playNotificationSound(); // 播放提示音（后续实现）
        // 使用 Electron 的 Notification API (后续实现)
        alert("时间到！"); 
      }
    }, 1000);
  }
    },
    // 应用预设时间
    applyPreset() {
      if (this.selectedPreset) {
        if (this.countdownRunning) return; // 运行时不可切换
        this.countdownHours = 0;
        this.countdownMinutes = minutes;
        this.countdownSeconds = 0;
      }
    },
    
    formatTime(milliseconds) {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const ms = Math.floor((milliseconds % 1000) / 10);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    },
    
    async openFloatingMode() {
      await this.saveSettings();
      if (window.electronAPI) {
        window.electronAPI.openFloating();
      }
    },
    
    async loadSettings() {
      if (window.electronAPI) {
        const savedSettings = await window.electronAPI.getSettings();
        this.settings = { ...this.settings, ...savedSettings };
      }
    },
    
    async saveSettings() {
      if (window.electronAPI) {
        await window.electronAPI.saveSettings(this.settings);
      }
    },
    
    toggleAlwaysOnTop() {
      this.saveSettings();
      if (window.electronAPI) {
        window.electronAPI.setAlwaysOnTop(this.settings.alwaysOnTop);
      }
    }
  }
}
</script>

<style scoped>
.main-panel {
  display: flex;
  width: 100vw;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', "SF Pro Text", "Helvetica Neue", Roboto, sans-serif;
  overflow: hidden;
  user-select: none;
}

/* 左侧时间显示区 */
.left-panel {
  flex: 1.2;
  background: linear-gradient(135deg, #a8e6cf, #dcedc1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #2c3e50;
  -webkit-app-region: drag; 
}

.time-display {
  text-align: center;
}

.current-time {
  font-size: 5rem;
  font-weight: 600;
  letter-spacing: -2px;
  margin-bottom: 1rem;
  line-height: 1;
  font-variant-numeric: tabular-nums;/* 等宽数字，防止秒跳动时文字抖动 */
  /* font-family: 'SF Pro Display', -apple-system, sans-serif; */
}

.date-info {
  font-size: 1.2rem;
  opacity: 0.8;
}

/* 右侧控制区 */
.right-panel {
  flex: 0.8;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  -webkit-app-region: no-drag;
}

/* 标签切换 */
.tab-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.tab-button {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button.active {
  background: rgba(255, 255, 255, 0.9);
  color: #2c3e50;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 内容区域 */
.content-area {
  flex: 1;
  margin-bottom: 2rem;
}

.mode-title {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
  font-weight: 500;
}

/* 时间输入 */
.time-input {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-group label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.input-group input {
  width: 60px;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  text-align: center;
  font-size: 1.2rem;
  font-weight: 500;
}

.separator {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0.5rem;
}

.time-value {
  font-size: 2rem;
  font-weight: 300;
  color: #2c3e50;
}

.time-input-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
  gap: 10px;
}

.time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.time-unit label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 4px;
  font-weight: 600;
}

.time-unit input {
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  text-align: center;
  font-size: 2rem;
  font-family: 'SF Pro Display', sans-serif;
  color: #2c3e50;
  outline: none;
  transition: all 0.3s;
  /* 去掉输入框的小箭头 */
  -moz-appearance: textfield;
}

.time-unit input::-webkit-outer-spin-button,
.time-unit input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.time-unit input:focus {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 4px rgba(79, 172, 254, 0.2);
  border-color: #4facfe;
}

.chip {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}

.chip:hover {
  background: rgba(255, 255, 255, 0.7);
  transform: translateY(-1px);
}

/* 控制按钮 */
.control-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.control-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.control-btn.start {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: white;
}

.control-btn.reset {
  background: rgba(255, 255, 255, 0.9);
  color: #666;
}

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* 预设选择 */
.preset-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.preset-label {
  color: #666;
  font-size: 0.9rem;
}

.preset-section select {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
}

/* 设置区域 */
.settings-section {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 2rem;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-group label {
  display: block;
  margin-bottom: 0.75rem;
  color: #2c3e50;
  font-weight: 500;
}

/* 字体选项 */
.font-options {
  display: flex;
  gap: 0.5rem;
}

.font-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.font-btn.active {
  background: rgba(255, 255, 255, 0.9);
  color: #2c3e50;
}

/* 背景选项 */
.background-options {
  display: flex;
  gap: 0.5rem;
}

.bg-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.bg-option.active {
  border-color: #4facfe;
  transform: scale(1.1);
}

/* 悬浮控制 */
.floating-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.floating-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.floating-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.toggle-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  cursor: pointer;
}
</style>