/**
 * 音效接口（MVP 桩实现）
 *
 * 不依赖任何音频素材文件：用 WebAudio 合成极简提示音，保证「开炮/命中/捕获/金币」
 * 有即时听感反馈；素材接入见文末 TODO。若浏览器不支持 WebAudio 则静默降级。
 *
 * 对外只暴露一个稳定接口：play(name)，name ∈ 'shoot' | 'hit' | 'capture' | 'coin'
 * 引擎只调用 play()，与具体发声方式解耦，二期替换为真实素材时无需改引擎。
 */

// 每种音效的合成参数：波形 / 起始频率 / 结束频率 / 时长(秒) / 音量
const TONES = {
  shoot: { type: 'square', from: 220, to: 120, dur: 0.08, gain: 0.06 },
  hit: { type: 'triangle', from: 320, to: 180, dur: 0.06, gain: 0.05 },
  capture: { type: 'sawtooth', from: 440, to: 880, dur: 0.18, gain: 0.07 },
  coin: { type: 'sine', from: 880, to: 1320, dur: 0.14, gain: 0.06 },
}

export class SoundManager {
  constructor() {
    this.enabled = true
    this.ctx = null
  }

  // 首次用户交互后再创建 AudioContext（浏览器自动播放策略要求）
  _ensureCtx() {
    if (this.ctx) return this.ctx
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    try {
      this.ctx = new AC()
    } catch {
      this.ctx = null
    }
    return this.ctx
  }

  setEnabled(on) {
    this.enabled = !!on
  }

  play(name) {
    if (!this.enabled) return
    const tone = TONES[name]
    if (!tone) return
    const ctx = this._ensureCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = tone.type
    osc.frequency.setValueAtTime(tone.from, now)
    osc.frequency.exponentialRampToValueAtTime(tone.to, now + tone.dur)

    gain.gain.setValueAtTime(tone.gain, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.dur)

    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + tone.dur)
  }

  destroy() {
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close()
      } catch {
        /* ignore */
      }
    }
    this.ctx = null
  }
}

// TODO(二期): 用 <audio>/AudioBuffer 加载真实素材，映射到相同的 play(name) 接口即可。
export default SoundManager
