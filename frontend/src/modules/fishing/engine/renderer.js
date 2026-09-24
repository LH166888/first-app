/**
 * 渲染层（Canvas 2D）— 接入成品美术素材
 *
 * 只负责把「当前帧状态」画出来，自身不推进游戏逻辑；唯一持有的内部状态是纯装饰性的
 * 气泡粒子（不影响玩法）。
 */
// 炮倍配色（用于瞄准辅助线、子弹 tint）
const MULT_COLORS = { 1: '#00e5ff', 2: '#7c5cff', 5: '#ff922b', 10: '#ff1744' }

// ===== 资源 URL =====
// 鱼 PNG（id → URL）
const FISH_IMAGES = {
  1: new URL('../assets/fish_1_yellow.png', import.meta.url).href,
  2: new URL('../assets/fish_2_tropical.png', import.meta.url).href,
  3: new URL('../assets/fish_3_puffer.png', import.meta.url).href,
  4: new URL('../assets/fish_4_turtle.png', import.meta.url).href,
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

// 序列帧图集
const SPRITE_ATLAS_URLS = {
  1: new URL('../assets/_demo_spine/by_01.png', import.meta.url).href,
  2: new URL('../assets/_demo_spine/by_02.png', import.meta.url).href,
  3: new URL('../assets/_demo_spine/by_03.png', import.meta.url).href,
  4: new URL('../assets/_demo_spine/fish10.png', import.meta.url).href,
  5: new URL('../assets/_demo_spine/shark1.png', import.meta.url).href,
  6: new URL('../assets/_demo_spine/shark2.png', import.meta.url).href,
  7: new URL('../assets/_demo_spine/by_07.png', import.meta.url).href,
  8: new URL('../assets/_demo_spine/fish8.png', import.meta.url).href,
}

// fish10 (species 4) 乌龟逐帧坐标表（10 帧，ox/oy 为质心相对 bbox 左上角偏移，用于消除腿伸出时的漂移）
const FISH10_FRAMES = [
  { x: 9, y: 11, w: 167, h: 159, ox: 78, oy: 70 },   // 帧 0
  { x: 9, y: 187, w: 165, h: 186, ox: 82, oy: 81 },   // 帧 1
  { x: 9, y: 380, w: 163, h: 162, ox: 85, oy: 74 },   // 帧 2
  { x: 9, y: 561, w: 165, h: 183, ox: 79, oy: 81 },   // 帧 3
  { x: 10, y: 770, w: 167, h: 134, ox: 77, oy: 58 },  // 帧 4
  { x: 10, y: 954, w: 168, h: 140, ox: 77, oy: 61 },  // 帧 5
  { x: 7, y: 1143, w: 163, h: 152, ox: 81, oy: 61 },  // 帧 6
  { x: 6, y: 1329, w: 159, h: 148, ox: 77, oy: 66 },  // 帧 7
  { x: 4, y: 1513, w: 162, h: 152, ox: 81, oy: 64 },  // 帧 8
  { x: 8, y: 1693, w: 160, h: 153, ox: 77, oy: 72 },  // 帧 9
]

// fish8 (species 8) 灯笼鱼逐帧坐标表（12 帧竖排，ox/oy 质心偏移，消除宽度变化和 stepY 累积误差）
const FISH8_FRAMES = [
  { x: 3, y: 0, w: 171, h: 122, ox: 81, oy: 52 },     // 帧 0
  { x: 3, y: 127, w: 171, h: 122, ox: 81, oy: 52 },   // 帧 1
  { x: 3, y: 255, w: 171, h: 120, ox: 80, oy: 52 },   // 帧 2
  { x: 3, y: 382, w: 171, h: 120, ox: 79, oy: 52 },   // 帧 3
  { x: 3, y: 507, w: 171, h: 121, ox: 80, oy: 53 },   // 帧 4
  { x: 2, y: 632, w: 172, h: 123, ox: 81, oy: 53 },   // 帧 5
  { x: 3, y: 757, w: 171, h: 123, ox: 81, oy: 52 },   // 帧 6
  { x: 2, y: 883, w: 172, h: 122, ox: 82, oy: 51 },   // 帧 7
  { x: 5, y: 1010, w: 169, h: 121, ox: 78, oy: 52 },  // 帧 8
  { x: 6, y: 1134, w: 168, h: 122, ox: 78, oy: 55 },  // 帧 9
  { x: 7, y: 1261, w: 167, h: 122, ox: 75, oy: 52 },  // 帧 10
  { x: 6, y: 1387, w: 168, h: 120, ox: 78, oy: 51 },  // 帧 11
]

// shark1 (species 5) 鲨鱼逐帧坐标表（12 帧竖排 509×3240，ox/oy 质心偏移）
const SHARK1_FRAMES = [
  { x: 7, y: 35, w: 500, h: 205, ox: 337, oy: 97 },     // 帧 0
  { x: 11, y: 305, w: 496, h: 207, ox: 336, oy: 99 },   // 帧 1
  { x: 31, y: 574, w: 476, h: 210, ox: 317, oy: 102 },  // 帧 2
  { x: 26, y: 844, w: 481, h: 211, ox: 324, oy: 101 },  // 帧 3
  { x: 12, y: 1114, w: 495, h: 211, ox: 338, oy: 99 },  // 帧 4
  { x: 5, y: 1385, w: 502, h: 208, ox: 341, oy: 96 },   // 帧 5
  { x: 13, y: 1656, w: 494, h: 205, ox: 331, oy: 94 },  // 帧 6
  { x: 11, y: 1926, w: 496, h: 205, ox: 333, oy: 94 },  // 帧 7
  { x: 22, y: 2216, w: 483, h: 190, ox: 318, oy: 88 },  // 帧 8
  { x: 83, y: 2430, w: 421, h: 263, ox: 259, oy: 121 }, // 帧 9
  { x: 30, y: 2744, w: 479, h: 215, ox: 312, oy: 99 },  // 帧 10
  { x: 76, y: 2977, w: 427, h: 258, ox: 269, oy: 122 }, // 帧 11
]

// shark2 (species 6) 金龙逐帧坐标表（12 帧竖排 516×3276，ox/oy 质心偏移，前 8 帧游动、后 4 帧死亡）
const SHARK2_FRAMES = [
  { x: 0, y: 30, w: 515, h: 216, ox: 331, oy: 106 },    // 帧 0
  { x: 1, y: 302, w: 514, h: 219, ox: 332, oy: 110 },   // 帧 1
  { x: 20, y: 575, w: 495, h: 221, ox: 316, oy: 112 },  // 帧 2
  { x: 16, y: 848, w: 499, h: 222, ox: 321, oy: 110 },  // 帧 3
  { x: 2, y: 1121, w: 513, h: 222, ox: 335, oy: 109 },  // 帧 4
  { x: 0, y: 1394, w: 515, h: 220, ox: 333, oy: 106 },  // 帧 5
  { x: 2, y: 1668, w: 513, h: 217, ox: 328, oy: 103 },  // 帧 6
  { x: 1, y: 1941, w: 514, h: 217, ox: 329, oy: 104 },  // 帧 7
  { x: 12, y: 2234, w: 500, h: 202, ox: 315, oy: 100 }, // 帧 8 死亡
  { x: 71, y: 2457, w: 440, h: 269, ox: 259, oy: 124 }, // 帧 9 死亡
  { x: 19, y: 2768, w: 497, h: 227, ox: 311, oy: 111 }, // 帧 10 死亡
  { x: 65, y: 3007, w: 445, h: 267, ox: 270, oy: 128 }, // 帧 11 死亡
]

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
    Object.values(SPRITE_ATLAS_URLS).forEach(url => imageLoader.load(url))
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

    // 序列帧动画配置（species → {帧数, 源帧宽, 源帧高, X步长, Y坐标, rotate标志}）
    const SPRITE_CONFIGS = {
      1: { frames: 10, sw: 36, sh: 68, stepX: 38, sy: 2, rotate: true, mirror: true },
      2: { frames: 4, sw: 40, sh: 55, stepX: 42, sy: 2, rotate: true, mirror: false },
      3: { frames: 10, sw: 50, sh: 75, stepX: 52, sy: 2, rotate: true, mirror: true },
      7: { frames: 10, sw: 70, sh: 84, stepX: 72, sy: 2, rotate: true, mirror: false },
    }

    const cfg = SPRITE_CONFIGS[fish.speciesId]
    if (cfg) {
      const atlasImg = imageLoader.get(SPRITE_ATLAS_URLS[fish.speciesId])
      if (atlasImg) {
        ctx.save()
        ctx.translate(fish.x, fish.y)

        const angle = fish.angle != null ? fish.angle : Math.atan2(fish.vy, fish.vx)
        ctx.rotate(angle)
        if (Math.cos(angle) < 0) ctx.scale(1, -1)

        const frameIndex = Math.floor(fish.age * 10) % cfg.frames
        const sx = 2 + frameIndex * cfg.stepX
        const sy = cfg.sy

        if (cfg.rotate) {
          if (cfg.mirror) ctx.scale(-1, 1)
          ctx.rotate(-Math.PI / 2)
          const scale = (fish.radius * 2.5) / cfg.sh
          const drawW = cfg.sw * scale
          const drawH = cfg.sh * scale
          ctx.drawImage(atlasImg, sx, sy, cfg.sw, cfg.sh, -drawW / 2, -drawH / 2, drawW, drawH)
        } else {
          if (cfg.mirror) ctx.scale(-1, 1)
          const scale = (fish.radius * 2.5) / cfg.sw
          const drawW = cfg.sw * scale
          const drawH = cfg.sh * scale
          ctx.drawImage(atlasImg, sx, sy, cfg.sw, cfg.sh, -drawW / 2, -drawH / 2, drawW, drawH)
        }

        ctx.restore()
        return
      }
    }

    // 乌龟(4)、灯笼鱼(8)：逐帧质心对齐分支（消除尺寸变化引起的抖动）
    const CENTROID_CONFIGS = {
      4: { frames: FISH10_FRAMES, swimFrames: 6, refW: 164, scale: 2.6, mirror: false },
      5: { frames: SHARK1_FRAMES, swimFrames: 8, refW: 500, scale: 2.6, mirror: false },
      6: { frames: SHARK2_FRAMES, swimFrames: 8, refW: 515, scale: 2.6, mirror: false },
      8: { frames: FISH8_FRAMES, swimFrames: 8, refW: 170, scale: 2.5, mirror: false },
    }
    const centCfg = CENTROID_CONFIGS[fish.speciesId]
    if (centCfg) {
      const atlasImg = imageLoader.get(SPRITE_ATLAS_URLS[fish.speciesId])
      if (atlasImg) {
        // 只循环正常游动帧，末尾的死亡帧（swimFrames 之后）不参与游动动画
        const loopFrames = centCfg.swimFrames || centCfg.frames.length
        const frameIndex = Math.floor(fish.age * 10) % loopFrames
        const frame = centCfg.frames[frameIndex]

        ctx.save()
        ctx.translate(fish.x, fish.y)

        const angle = fish.angle != null ? fish.angle : Math.atan2(fish.vy, fish.vx)
        ctx.rotate(angle)
        if (Math.cos(angle) < 0) ctx.scale(1, -1)

        const scale = (fish.radius * centCfg.scale) / centCfg.refW
        const drawW = frame.w * scale
        const drawH = frame.h * scale
        ctx.drawImage(atlasImg, frame.x, frame.y, frame.w, frame.h, -frame.ox * scale, -frame.oy * scale, drawW, drawH)

        ctx.restore()
        return
      }
    }

    // 其他 species：原有静态 PNG 或降级色块
    const img = imageLoader.get(FISH_IMAGES[fish.speciesId])

    ctx.save()
    ctx.translate(fish.x, fish.y)
    // 朝向：让鱼头沿运动方向（曲线切线）。素材原图头朝右，
    // 直接按 angle 旋转；当游向左半边时图会上下颠倒，故对该区间垂直翻转。
    const angle = fish.angle != null ? fish.angle : Math.atan2(fish.vy, fish.vx)
    ctx.rotate(angle)
    if (Math.cos(angle) < 0) ctx.scale(1, -1)

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
