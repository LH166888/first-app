/**
 * 渲染层（Canvas 2D）
 *
 * 只负责把「当前帧状态」画出来，自身不推进游戏逻辑；唯一持有的内部状态是纯装饰性的
 * 气泡粒子（不影响玩法）。鱼暂用色块+尾鳍占位，接入美术资源时只改 drawFish 即可。
 */
import config from '../config/games-fishing-config.json'

// 鱼种配色（占位色块）。key = 鱼种 id。
const FISH_COLORS = {
  1: '#ffe066', // 小黄鱼
  2: '#ff6fa5', // 热带鱼
  3: '#ffa94d', // 河豚
  4: '#69db7c', // 乌龟
  5: '#868e96', // 鲨鱼
  6: '#ffd43b', // 金龙
  7: '#fcc419', // 元宝鱼
  8: '#4dabf7', // 灯笼鱼
}

// 炮倍配色
const MULT_COLORS = { 1: '#00e5ff', 2: '#7c5cff', 5: '#ff922b', 10: '#ff1744' }

// 鱼种名（用于大鱼标签）
const FISH_NAMES = config.fish_species.reduce((m, f) => {
  m[f.id] = f.name
  return m
}, {})

export class Renderer {
  constructor(ctx, w, h) {
    this.ctx = ctx
    this.w = w
    this.h = h
    this.bubbles = []
    this._initBubbles()
  }

  resize(w, h) {
    this.w = w
    this.h = h
    this._initBubbles()
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
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#04305c')
    g.addColorStop(0.55, '#012349')
    g.addColorStop(1, '#000814')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    // 顶部光晕，营造海面透光
    const rg = ctx.createRadialGradient(w / 2, -h * 0.2, 0, w / 2, -h * 0.2, h)
    rg.addColorStop(0, 'rgba(120, 200, 255, 0.18)')
    rg.addColorStop(1, 'rgba(120, 200, 255, 0)')
    ctx.fillStyle = rg
    ctx.fillRect(0, 0, w, h)
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
    const color = FISH_COLORS[fish.speciesId] || '#ffffff'
    ctx.save()
    ctx.translate(fish.x, fish.y)
    // 朝向：按水平速度翻转
    const facing = fish.vx < 0 ? -1 : 1
    ctx.scale(facing, 1)

    // 尾鳍（随时间摆动）
    const tail = Math.sin(fish.age * 8 + fish.phase) * fish.radius * 0.35
    ctx.fillStyle = color
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.moveTo(-fish.radius * 0.8, 0)
    ctx.lineTo(-fish.radius * 1.5, tail - fish.radius * 0.4)
    ctx.lineTo(-fish.radius * 1.5, tail + fish.radius * 0.4)
    ctx.closePath()
    ctx.fill()

    // 鱼身
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.ellipse(0, 0, fish.radius, fish.radius * 0.62, 0, 0, Math.PI * 2)
    ctx.fill()

    // 眼睛
    ctx.fillStyle = '#0b1622'
    ctx.beginPath()
    ctx.arc(fish.radius * 0.45, -fish.radius * 0.15, Math.max(1.5, fish.radius * 0.12), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // 赔率标签（中大型鱼才显示，避免小鱼刷屏）
    if (fish.payout >= 10) {
      ctx.save()
      ctx.fillStyle = '#ffd166'
      ctx.font = 'bold 12px "Courier New", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`${FISH_NAMES[fish.speciesId] || ''}×${fish.payout}`, fish.x, fish.y - fish.radius - 6)
      ctx.restore()
    }
  }

  _drawBullet(b) {
    const { ctx } = this
    const color = MULT_COLORS[b.multiplier] || '#00e5ff'
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  _drawEffects(effects) {
    const { ctx } = this
    if (!effects) return
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
        const r = (1 - alpha) * 22 + 4
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      } else if (e.type === 'coin') {
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = '#ffd43b'
        ctx.beginPath()
        ctx.arc(e.x, e.y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#b8860b'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  _drawCannon(cannon, aim) {
    const { ctx } = this
    const color = MULT_COLORS[cannon.multiplier] || '#00e5ff'

    // 瞄准辅助虚线
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

    ctx.save()
    ctx.translate(cannon.x, cannon.y)
    ctx.rotate(cannon.angle + Math.PI / 2) // 炮管默认竖直，angle=-90°朝上

    // 炮管
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 12
    ctx.fillRect(-6, -cannon.barrelLength, 12, cannon.barrelLength)
    ctx.restore()

    // 炮座
    ctx.save()
    ctx.fillStyle = '#1b2a3a'
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cannon.x, cannon.y, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 炮倍徽标
    ctx.fillStyle = color
    ctx.font = 'bold 14px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${cannon.multiplier}×`, cannon.x, cannon.y)
    ctx.restore()
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
