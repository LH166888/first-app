/**
 * 渲染层（Canvas 2D）— 接入成品美术素材
 *
 * 只负责把「当前帧状态」画出来，自身不推进游戏逻辑；唯一持有的内部状态是纯装饰性的
 * 气泡粒子（不影响玩法）。
 */
import config from '../config/games-fishing-config.json'

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
const BG_URL = new URL('../assets/background.png', import.meta.url).href
const EFFECT_HIT_URL = new URL('../assets/effect_hit.png', import.meta.url).href
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
    this.bubbles = []
    this._initBubbles()
    this._preloadAssets()
  }

  resize(w, h) {
    this.w = w
    this.h = h
    this._initBubbles()
  }

  _preloadAssets() {
    // 异步预加载所有图片，加载失败各自降级（不阻塞渲染）
    Object.values(FISH_IMAGES).forEach(url => imageLoader.load(url))
    Object.values(CANNON_IMAGES).forEach(url => imageLoader.load(url))
    imageLoader.load(BULLET_URL)
    imageLoader.load(COIN_URL)
    imageLoader.load(BG_URL)
    imageLoader.load(EFFECT_HIT_URL)
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
    this._drawBackground()
    this._drawBubbles(dt)
    for (const fish of state.fishes) this._drawFish(fish)
    for (const b of state.bullets) this._drawBullet(b)
    this._drawEffects(state.effects)
    this._drawCannon(state.cannon, state.aim)
    if (state.paused) this._drawPausedMask()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }

  _drawBackground() {
    const { ctx, w, h } = this
    const bgImg = imageLoader.get(BG_URL)
    if (bgImg) {
      // 背景图 1920×1080，按画布比例缩放并居中绘制（保持覆盖，裁切溢出）
      const scale = Math.max(w / bgImg.width, h / bgImg.height)
      const sw = w / scale
      const sh = h / scale
      const sx = (bgImg.width - sw) / 2
      const sy = (bgImg.height - sh) / 2
      ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, w, h)
    } else {
      // 降级：渐变背景
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#04305c')
      g.addColorStop(0.55, '#012349')
      g.addColorStop(1, '#000814')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      // 顶部光晕
      const rg = ctx.createRadialGradient(w / 2, -h * 0.2, 0, w / 2, -h * 0.2, h)
      rg.addColorStop(0, 'rgba(120, 200, 255, 0.18)')
      rg.addColorStop(1, 'rgba(120, 200, 255, 0)')
      ctx.fillStyle = rg
      ctx.fillRect(0, 0, w, h)
    }
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

  _drawFish(fish) {
    const { ctx } = this
    const img = imageLoader.get(FISH_IMAGES[fish.speciesId])

    ctx.save()
    ctx.translate(fish.x, fish.y)
    // 朝向：按水平速度翻转
    const facing = fish.vx < 0 ? -1 : 1
    ctx.scale(facing, 1)

    if (img) {
      // 鱼图中心锚点，按 radius 缩放绘制（源图约为推荐尺寸的 2×）
      const drawW = fish.radius * 2.5
      const drawH = (img.height / img.width) * drawW
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    } else {
      // 降级：占位色块（旧逻辑）
      const color = this._getFallbackFishColor(fish.speciesId)
      const tail = Math.sin(fish.age * 8 + fish.phase) * fish.radius * 0.35
      ctx.fillStyle = color
      ctx.globalAlpha = 0.9
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
    const hitImg = imageLoader.get(EFFECT_HIT_URL)
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
        ctx.save()
        ctx.globalAlpha = alpha
        if (hitImg) {
          const scale = 0.4 + (1 - alpha) * 0.6  // 从小到大扩散
          const size = hitImg.width * scale * 0.4
          ctx.drawImage(hitImg, e.x - size / 2, e.y - size / 2, size, size)
        } else {
          // 降级：原圆圈
          const r = (1 - alpha) * 22 + 4
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
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
