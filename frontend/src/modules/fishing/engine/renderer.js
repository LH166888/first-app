/**
 * 渲染层（Canvas 2D）— 接入成品美术素材
 *
 * 只负责把「当前帧状态」画出来，自身不推进游戏逻辑；唯一持有的内部状态是纯装饰性的
 * 气泡粒子（不影响玩法）。
 */
import config from '../config/games-fishing-config.json'
import { Seabed } from './seabed'

// 炮倍配色（用于瞄准辅助线、子弹 tint）
const MULT_COLORS = { 1: '#00e5ff', 2: '#7c5cff', 5: '#ff922b', 10: '#ff1744' }

// 鱼种名（用于大鱼标签）
const FISH_NAMES = config.fish_species.reduce((m, f) => {
  m[f.id] = f.name
  return m
}, {})

// ===== 资源 URL =====
// 鱼 PNG（id → URL）
const FISH_IMAGES = {
  1: new URL('../assets/fish_1_yellow.png', import.meta.url).href,
  2: new URL('../assets/fish_2_tropical.png', import.meta.url).href,
  3: new URL('../assets/fish_3_puffer.png', import.meta.url).href,
  4: new URL('../assets/fish_4_turtle.png', import.meta.url).href,
  8: new URL('../assets/fish_8_lantern.png', import.meta.url).href,
  5: new URL('../assets/fish_5_shark.png', import.meta.url).href,
  6: new URL('../assets/fish_6_golden_dragon.png', import.meta.url).href,
  7: new URL('../assets/fish_7_yuanbao.png', import.meta.url).href,
}

// 炮台 PNG（multiplier → URL）
const CANNON_IMAGES = {
  1: new URL('../assets/cannon_1x.png', import.meta.url).href,
  2: new URL('../assets/cannon_2x.png', import.meta.url).href,
  5: new URL('../assets/cannon_5x.png', import.meta.url).href,
  10: new URL('../assets/cannon_10x.png', import.meta.url).href,
}

// 通用素材
const BULLET_URL = new URL('../assets/bullet.png', import.meta.url).href
const COIN_URL = new URL('../assets/coin.png', import.meta.url).href
const EFFECT_CAPTURE_URL = new URL('../assets/effect_capture.png', import.meta.url).href

// ===== 图片预加载器 =====
class ImageLoader {
  constructor() {
    this._cache = new Map()
    this._loading = new Map()
  }

  load(url) {
    if (this._cache.has(url)) return this._cache.get(url)
    if (this._loading.has(url)) return this._loading.get(url)
    const promise = new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        this._cache.set(url, img)
        this._loading.delete(url)
        resolve(img)
      }
      img.onerror = () => {
        this._loading.delete(url)
        resolve(null) // 加载失败返回 null，渲染层降级
      }
      img.src = url
    })
    this._loading.set(url, promise)
    return promise
  }

  get(url) {
    return this._cache.get(url) || null
  }
}

const imageLoader = new ImageLoader()

export class Renderer {
  constructor(ctx, w, h) {
    this.ctx = ctx
    this.w = w
    this.h = h
    this.seabed = new Seabed(w, h)
    this.bubbles = []
    this._initBubbles()
    this._preloadAssets()
  }

  resize(w, h) {
    this.w = w
    this.h = h
    this.seabed.resize(w, h)
    this._initBubbles()
  }

  _preloadAssets() {
    // 异步预加载所有图片，加载失败各自降级（不阻塞渲染）
    Object.values(FISH_IMAGES).forEach(url => imageLoader.load(url))
    Object.values(CANNON_IMAGES).forEach(url => imageLoader.load(url))
    imageLoader.load(BULLET_URL)
    imageLoader.load(COIN_URL)
    imageLoader.load(EFFECT_CAPTURE_URL)
  }

  _initBubbles() {
    const count = Math.round((this.w * this.h) / 26000)
    this.bubbles = Array.from({ length: count }, () => ({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      r: 1 + Math.random() * 3,
      speed: 8 + Math.random() * 22,
      drift: (Math.random() - 0.5) * 6,
      alpha: 0.1 + Math.random() * 0.25,
    }))
  }

  render(state, dt) {
    const { ctx } = this
    // 动态海底背景（底层）
    this.seabed.drawBack(ctx, dt)
    this._drawBubbles(dt)
    for (const fish of state.fishes) this._drawFish(fish, dt)
    for (const b of state.bullets) this._drawBullet(b)
    this._drawEffects(state.effects)
    this._drawCannon(state.cannon, state.aim)
    // 前景微粒 + 暗角/色调分级（在所有实体之上，统一氛围）
    this.seabed.drawFront(ctx, dt)
    if (state.paused) this._drawPausedMask()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }

  _drawBubbles(dt) {
    const { ctx, w, h } = this
    ctx.save()
    for (const b of this.bubbles) {
      b.y -= b.speed * dt
      b.x += b.drift * dt
      if (b.y < -b.r) {
        b.y = h + b.r
        b.x = Math.random() * w
      }
      ctx.beginPath()
      ctx.fillStyle = `rgba(180, 225, 255, ${b.alpha})`
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  _drawFish(fish, dt) {
    const { ctx } = this
    const img = imageLoader.get(FISH_IMAGES[fish.speciesId])

    // ---- 平滑转向：facing 从 -1↔1 缓动，转身时水平收缩形成翻转过渡（纯渲染态，挂在 fish 上）----
    const targetFacing = fish.vx < 0 ? -1 : 1
    if (fish._facing === undefined) fish._facing = targetFacing
    const k = Math.min(1, (dt || 0.016) * 10)
    fish._facing += (targetFacing - fish._facing) * k
    const facing = fish._facing
    const flipScale = Math.max(0.12, Math.abs(facing)) * (facing < 0 ? -1 : 1)

    // ---- 受击反馈：抖动 + 白闪 ----
    const hf = fish.hitFlash > 0 ? fish.hitFlash / 0.22 : 0
    const shakeX = hf ? (Math.random() - 0.5) * fish.radius * 0.5 * hf : 0
    const shakeY = hf ? (Math.random() - 0.5) * fish.radius * 0.5 * hf : 0

    // ---- 游动行波：沿身体从头到尾传播的正弦波，越靠尾摆幅越大 ----
    const bendBase = Math.sin(fish.age * fish.wobbleFreq + fish.phase) * 0.22

    ctx.save()
    ctx.translate(fish.x + shakeX, fish.y + shakeY)
    ctx.scale(flipScale, 1)

    if (img) {
      const drawW = fish.radius * 2.5
      const drawH = (img.height / img.width) * drawW
      // 竖切片沿身体扫描：每片按到头部的距离取相位延迟，产生尾随摆动的“游动”而非整体平移
      const SLICES = 10
      const sliceW = img.width / SLICES
      const dstSliceW = drawW / SLICES
      for (let i = 0; i < SLICES; i++) {
        const t = i / (SLICES - 1) // 0=尾 … 1=头（源图默认朝右，头在右）
        const tailWeight = (1 - t) * (1 - t) // 越靠尾越大
        const wavePhase = fish.age * fish.wobbleFreq + fish.phase - t * 2.4
        const yOff = Math.sin(wavePhase) * fish.radius * 0.5 * tailWeight
        const sx = i * sliceW
        const dx = -drawW / 2 + i * dstSliceW
        ctx.drawImage(img, sx, 0, sliceW, img.height, dx, -drawH / 2 + yOff, dstSliceW + 0.6, drawH)
      }
      if (hf) {
        // 白闪叠加：用 lighter 提亮命中瞬间
        ctx.save()
        ctx.globalAlpha = hf * 0.6
        ctx.globalCompositeOperation = 'lighter'
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.ellipse(0, 0, drawW * 0.42, drawH * 0.42, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    } else {
      // 降级：占位色块 + 摆尾（无图时的兜底，观感仍然“在游”）
      const color = this._getFallbackFishColor(fish.speciesId)
      const tail = Math.sin(fish.age * fish.wobbleFreq * 1.6 + fish.phase) * fish.radius * 0.45
      ctx.rotate(bendBase)
      ctx.fillStyle = hf ? '#ffffff' : color
      ctx.globalAlpha = 0.92
      ctx.beginPath()
      ctx.moveTo(-fish.radius * 0.8, 0)
      ctx.lineTo(-fish.radius * 1.5, tail - fish.radius * 0.4)
      ctx.lineTo(-fish.radius * 1.5, tail + fish.radius * 0.4)
      ctx.closePath()
      ctx.fill()

      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.ellipse(0, 0, fish.radius, fish.radius * 0.62, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#0b1622'
      ctx.beginPath()
      ctx.arc(fish.radius * 0.45, -fish.radius * 0.15, Math.max(1.5, fish.radius * 0.12), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    // 赔率标签（中大型鱼才显示）
    if (fish.payout >= 10) {
      ctx.save()
      ctx.fillStyle = '#ffd166'
      ctx.font = 'bold 12px "Courier New", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`${FISH_NAMES[fish.speciesId] || ''}×${fish.payout}`, fish.x, fish.y - fish.radius - 6)
      ctx.restore()
    }
  }

  _getFallbackFishColor(speciesId) {
    const colors = {
      1: '#ffe066', 2: '#ff6fa5', 3: '#ffa94d', 4: '#69db7c',
      5: '#868e96', 6: '#ffd43b', 7: '#fcc419', 8: '#4dabf7',
    }
    return colors[speciesId] || '#ffffff'
  }

  _drawBullet(b) {
    const { ctx } = this
    const img = imageLoader.get(BULLET_URL)
    const color = MULT_COLORS[b.multiplier] || '#00e5ff'

    if (img) {
      // 按炮台色 tint：先画着色矩形，再用 source-atop 叠上图片
      const size = (b.radius * 2 + 4)
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.rotate(b.angle)
      // 用 globalCompositeOperation 实现 tint
      const offscreen = document.createElement('canvas')
      offscreen.width = img.width
      offscreen.height = img.height
      const oc = offscreen.getContext('2d')
      oc.drawImage(img, 0, 0)
      oc.globalCompositeOperation = 'source-atop'
      oc.fillStyle = color
      oc.globalAlpha = 0.55
      oc.fillRect(0, 0, img.width, img.height)
      ctx.drawImage(offscreen, -size / 2, -size / 2, size, size)
      ctx.restore()
    } else {
      // 降级：原占位圆点
      ctx.save()
      ctx.shadowColor = color
      ctx.shadowBlur = 10
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  _drawEffects(effects) {
    const { ctx } = this
    if (!effects) return
    const captureImg = imageLoader.get(EFFECT_CAPTURE_URL)
    const coinImg = imageLoader.get(COIN_URL)

    for (const e of effects) {
      const alpha = Math.max(0, e.life / e.maxLife)
      if (e.type === 'float') {
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = e.color || '#ffd166'
        ctx.font = 'bold 16px "Courier New", monospace'
        ctx.textAlign = 'center'
        ctx.fillText(e.text, e.x, e.y)
        ctx.restore()
      } else if (e.type === 'hit') {
        // 程序化命中特效：扩散圆环 + 放射火花（替代静态单图，无素材依赖）
        const p = 1 - alpha // 进度 0→1
        ctx.save()
        ctx.translate(e.x, e.y)
        // 扩散圆环
        const ringR = 6 + p * 26
        ctx.globalAlpha = alpha
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'
        ctx.lineWidth = 2.5 * alpha + 0.5
        ctx.beginPath()
        ctx.arc(0, 0, ringR, 0, Math.PI * 2)
        ctx.stroke()
        // 放射火花
        ctx.globalAlpha = alpha * 0.9
        ctx.strokeStyle = '#ffe08a'
        ctx.lineWidth = 2
        const SPARKS = 6
        for (let s = 0; s < SPARKS; s++) {
          const a = (Math.PI * 2 * s) / SPARKS + (e.seed || 0)
          const r0 = 4 + p * 10
          const r1 = r0 + 8 * alpha + 4
          ctx.beginPath()
          ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0)
          ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1)
          ctx.stroke()
        }
        ctx.restore()
      } else if (e.type === 'coin') {
        ctx.save()
        ctx.globalAlpha = alpha
        if (coinImg) {
          const size = 18
          ctx.drawImage(coinImg, e.x - size / 2, e.y - size / 2, size, size)
        } else {
          // 降级：原金币圆点
          ctx.fillStyle = '#ffd43b'
          ctx.beginPath()
          ctx.arc(e.x, e.y, 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#b8860b'
          ctx.lineWidth = 1
          ctx.stroke()
        }
        ctx.restore()
      }
    }
    // captureImg 用于 float 特效增强：在大额奖励的 float 旁叠加捕获特效帧
    void captureImg  // 预留，目前通过 float 文字呈现即可
  }

  _drawCannon(cannon, aim) {
    const { ctx } = this
    const color = MULT_COLORS[cannon.multiplier] || '#00e5ff'
    const img = imageLoader.get(CANNON_IMAGES[cannon.multiplier])

    // 瞄准辅助虚线（保留）
    if (aim) {
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.setLineDash([6, 8])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cannon.x, cannon.y)
      ctx.lineTo(aim.x, aim.y)
      ctx.stroke()
      ctx.restore()
    }

    if (img) {
      // 成品图 192×192，含底座+炮管+徽标，按炮管方向旋转整体
      const size = 72  // 渲染尺寸（与原占位底座半径 18 + 炮管 40 相近）
      ctx.save()
      ctx.translate(cannon.x, cannon.y)
      ctx.rotate(cannon.angle + Math.PI / 2)
      ctx.drawImage(img, -size / 2, -size / 2, size, size)
      ctx.restore()
    } else {
      // 降级：原占位绘制
      ctx.save()
      ctx.translate(cannon.x, cannon.y)
      ctx.rotate(cannon.angle + Math.PI / 2)
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 12
      ctx.fillRect(-6, -cannon.barrelLength, 12, cannon.barrelLength)
      ctx.restore()

      ctx.save()
      ctx.fillStyle = '#1b2a3a'
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(cannon.x, cannon.y, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = color
      ctx.font = 'bold 14px "Courier New", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${cannon.multiplier}×`, cannon.x, cannon.y)
      ctx.restore()
    }
  }

  _drawPausedMask() {
    const { ctx, w, h } = this
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('已暂停', w / 2, h / 2)
    ctx.restore()
  }
}

export default Renderer
