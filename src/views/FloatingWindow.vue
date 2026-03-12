<template>
  <div class="floating-window" :style="windowStyle">
    <div class="floating-content">
      <button class="close-btn" @click="closeFloating">×</button>
      <div class="floating-time">{{ currentTime }}</div>
      <button class="expand-btn" @click="expandWindow">⚙️</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FloatingWindow',
  data() {
    return {
      currentTime: '',
      settings: {
        font: 'Geometric',
        background: 'gradient-1'
      }
    }
  },
  
  computed: {
    windowStyle() {
      const backgrounds = {
        'gradient-1': 'linear-gradient(135deg, #a8e6cf, #88d8c0)',
        'gradient-2': 'linear-gradient(135deg, #ffd3a5, #fd9853)',
        'gradient-3': 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
        'gradient-4': 'linear-gradient(135deg, #84fab0, #8fd3f4)',
        'gradient-5': 'linear-gradient(135deg, #fa709a, #fee140)'
      };
      
      return {
        background: backgrounds[this.settings.background] || backgrounds['gradient-1']
      };
    }
  },
  
  mounted() {
    this.updateTime();
    setInterval(this.updateTime, 1000);
    this.loadSettings();
    
    // 使窗口可拖拽
    document.addEventListener('mousedown', this.startDrag);
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
    },
    
    async loadSettings() {
      if (window.electronAPI) {
        const savedSettings = await window.electronAPI.getSettings();
        this.settings = { ...this.settings, ...savedSettings };
      }
    },
    
    closeFloating() {
      if (window.electronAPI) {
        window.electronAPI.closeFloating();
      }
    },
    
    expandWindow() {
      if (window.electronAPI) {
        window.electronAPI.closeFloating();
      }
    },
    
    startDrag(e) {
      // 简单的拖拽实现，实际应该通过 Electron API
      e.preventDefault();
    }
  }
}
</script>

<style scoped>
.floating-window {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: drag; /* 使整个窗口可拖拽 */
}

.floating-content {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 40px;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
}

.floating-time {
  font-size: 1.8rem;
  font-weight: 300;
  color: #2c3e50;
  font-family: 'SF Pro Display', -apple-system, sans-serif;
  letter-spacing: 0.5px;
}

.close-btn, .expand-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  -webkit-app-region: no-drag; /* 按钮不参与拖拽 */
}

.close-btn:hover, .expand-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.close-btn {
  font-size: 1.2rem;
  line-height: 1;
}
</style>