/**
 * 音效接口 — 用真实素材替换合成桩
 *
 * 首次用户交互时创建 AudioContext 并异步预加载所有 AudioBuffer；
 * 加载完成前 play() 静默跳过（不报错）。接口签名零改动：
 *   play(name)   name ∈ 'shoot' | 'hit' | 'capture' | 'coin'
 *   setEnabled(on)
 *   destroy()
 * BGM 默认关闭，可通过 startBgm() / stopBgm() 控制。
 */

const SFX_URLS = {
  shoot:   new URL('../assets/sfx_shoot.wav',   import.meta.url).href,
  hit:     new URL('../assets/sfx_hit.wav',     import.meta.url).href,
  capture: new URL('../assets/sfx_capture.wav', import.meta.url).href,
  coin:    new URL('../assets/sfx_coin.wav',    import.meta.url).href,
}
const BGM_URL = new URL('../assets/bgm_loop.wav', import.meta.url).href

export class SoundManager {
  constructor() {
    this.enabled = true
    this.ctx = null
    this._buffers = {}   // name → AudioBuffer，加载后填入
    this._bgmSource = null
    this._bgmBuffer = null
  }

  // 首次用户交互后再创建 AudioContext（浏览器自动播放策略要求）
  _ensureCtx() {
    if (this.ctx) return this.ctx
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    try {
      this.ctx = new AC()
      this._preload()
    } catch {
      this.ctx = null
    }
    return this.ctx
  }

  async _preload() {
    const ctx = this.ctx
    if (!ctx) return
    // 并行加载所有音效
    await Promise.all(
      Object.entries(SFX_URLS).map(async ([name, url]) => {
        try {
          const res = await fetch(url)
          const ab = await res.arrayBuffer()
          this._buffers[name] = await ctx.decodeAudioData(ab)
        } catch { /* 单个文件加载失败不影响其余音效 */ }
      })
    )
    // BGM 单独预加载
    try {
      const res = await fetch(BGM_URL)
      const ab = await res.arrayBuffer()
      this._bgmBuffer = await ctx.decodeAudioData(ab)
    } catch { /* BGM 可选，失败静默 */ }
  }

  setEnabled(on) {
    this.enabled = !!on
    if (!on) this.stopBgm()
  }

  play(name) {
    if (!this.enabled) return
    const ctx = this._ensureCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()

    const buf = this._buffers[name]
    if (!buf) return  // 未加载完成，静默跳过

    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start()
  }

  startBgm() {
    const ctx = this._ensureCtx()
    if (!ctx || !this._bgmBuffer || this._bgmSource) return
    if (ctx.state === 'suspended') ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = this._bgmBuffer
    src.loop = true
    src.connect(ctx.destination)
    src.start()
    this._bgmSource = src
  }

  stopBgm() {
    if (this._bgmSource) {
      try { this._bgmSource.stop() } catch { /* ignore */ }
      this._bgmSource = null
    }
  }

  destroy() {
    this.stopBgm()
    if (this.ctx && this.ctx.state !== 'closed') {
      try { this.ctx.close() } catch { /* ignore */ }
    }
    this.ctx = null
    this._buffers = {}
    this._bgmBuffer = null
  }
}

export default SoundManager
