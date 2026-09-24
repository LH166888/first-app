/**
 * 动态海底背景（纯 Canvas 2D 程序化绘制，无美术资源依赖）
 *
 * 只画背景氛围，不参与任何玩法逻辑。层次自后向前：
 *   底色渐变 → 焦散光束(god rays) → 焦散光斑(caustics) →
 *   远景礁石剪影 → 中景礁石/珊瑚 → 摇曳海草 → 浮游微粒
 * 另有一层 overlay（暗角 + 冷色调分级）在所有实体之上叠加，统一氛围。
 *
 * 性能约束（移动端不卡顿）：
 *   - 几何（礁石/海草/微粒）在 resize 时一次性生成，逐帧只做正弦位移与填充；
 *   - 焦散贴图预渲染到离屏 canvas，逐帧仅平移+变透明度绘制两层，避免逐像素运算。
 */

// ===== 小工具 =====
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Seabed {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.t = 0
    this._caustics = null
    this._build()
  }

  resize(w, h) {
    this.w = w
    this.h = h
    this._build()
  }

  _build() {
    // 固定种子：同一尺寸下形态稳定，避免 resize 抖动
    const rnd = mulberry32(0x9e3779b1 ^ (this.w * 73856093) ^ (this.h * 19349663))
    this._buildRays(rnd)
    this._buildReef(rnd)
    this._buildSeaweed(rnd)
    this._buildMotes(rnd)
    this._buildCaustics()
  }

  // 光束：从水面斜射的几道光柱
  _buildRays(rnd) {
    const n = 5
    this.rays = Array.from({ length: n }, (_, i) => ({
      x: (this.w * (i + 0.5)) / n + (rnd() - 0.5) * this.w * 0.1,
      width: this.w * (0.05 + rnd() * 0.06),
      angle: -0.18 + rnd() * 0.36, // 相对竖直的倾斜
      speed: 0.15 + rnd() * 0.25,
      phase: rnd() * Math.PI * 2,
      alpha: 0.05 + rnd() * 0.05,
    }))
  }

  // 远/中景礁石剪影：底部若干起伏的丘状轮廓
  _buildReef(rnd) {
    const makeRidge = (baseY, amp, step, drift, color) => {
      const pts = []
      for (let x = -step; x <= this.w + step; x += step) {
        pts.push({ x, y: baseY + (rnd() - 0.5) * amp })
      }
      return { pts, drift, color, phase: rnd() * Math.PI * 2 }
    }
    // 远景（更暗更靠上，漂移慢），中景（更亮更靠下，漂移略快）
    this.reefFar = makeRidge(this.h * 0.72, this.h * 0.10, this.w * 0.14, 6, 'rgba(6, 42, 58, 0.55)')
    this.reefMid = makeRidge(this.h * 0.86, this.h * 0.12, this.w * 0.10, 11, 'rgba(4, 28, 40, 0.75)')
    // 珊瑚簇（中景之上的几处剪影）
    const coralN = Math.max(3, Math.round(this.w / 320))
    this.corals = Array.from({ length: coralN }, () => ({
      x: rnd() * this.w,
      y: this.h * (0.82 + rnd() * 0.12),
      s: this.h * (0.05 + rnd() * 0.06),
      hue: 170 + rnd() * 60,
      phase: rnd() * Math.PI * 2,
    }))
  }

  _buildSeaweed(rnd) {
    const n = Math.max(6, Math.round(this.w / 130))
    this.weeds = Array.from({ length: n }, () => {
      const h = this.h * (0.14 + rnd() * 0.16)
      return {
        x: rnd() * this.w,
        h,
        segW: 6 + rnd() * 6,
        freq: 0.6 + rnd() * 0.7,
        amp: h * (0.14 + rnd() * 0.12),
        phase: rnd() * Math.PI * 2,
        hue: 120 + rnd() * 40,
        alpha: 0.28 + rnd() * 0.22,
      }
    })
  }

  _buildMotes(rnd) {
    // 两层浮游微粒：远层慢而暗，近层快而亮
    const mk = (count, sMin, sMax, spMin, spMax, aMin, aMax) =>
      Array.from({ length: count }, () => ({
        x: rnd() * this.w,
        y: rnd() * this.h,
        r: sMin + rnd() * (sMax - sMin),
        vy: -(spMin + rnd() * (spMax - spMin)),
        vx: (rnd() - 0.5) * 6,
        alpha: aMin + rnd() * (aMax - aMin),
        ph: rnd() * Math.PI * 2,
      }))
    const area = this.w * this.h
    this.motesFar = mk(Math.round(area / 42000), 0.6, 1.4, 3, 8, 0.05, 0.14)
    this.motesNear = mk(Math.round(area / 60000), 1.0, 2.2, 8, 16, 0.10, 0.22)
  }

  _buildCaustics() {
    const size = 256
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const g = c.getContext('2d')
    const rnd = mulberry32(0x1234567)
    // 若干柔和高光斑，拼出网状焦散质感
    for (let i = 0; i < 46; i++) {
      const x = rnd() * size
      const y = rnd() * size
      const r = 14 + rnd() * 40
      const rg = g.createRadialGradient(x, y, 0, x, y, r)
      const a = 0.10 + rnd() * 0.18
      rg.addColorStop(0, `rgba(210, 245, 255, ${a})`)
      rg.addColorStop(1, 'rgba(210, 245, 255, 0)')
      g.fillStyle = rg
      g.fillRect(x - r, y - r, r * 2, r * 2)
    }
    this._caustics = c
  }

  // ===== 逐帧绘制 =====

  /** 底层：色带渐变 + 光束 + 焦散 + 礁石 + 海草 + 微粒。在实体之前调用。 */
  drawBack(ctx, dt) {
    this.t += dt
    this._drawGradient(ctx)
    this._drawRays(ctx)
    this._drawCaustics(ctx)
    this._drawReef(ctx)
    this._drawSeaweed(ctx)
    this._drawMotes(ctx, this.motesFar, dt)
  }

  /** 前层：近景微粒 + 暗角 + 冷色调分级。在实体之后调用。 */
  drawFront(ctx, dt) {
    this._drawMotes(ctx, this.motesNear, dt)
    this._drawVignette(ctx)
  }

  _drawGradient(ctx) {
    const { w, h } = this
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#0a5b7a')
    g.addColorStop(0.35, '#064c6b')
    g.addColorStop(0.7, '#03324c')
    g.addColorStop(1, '#01141f')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    // 顶部水面光晕
    const rg = ctx.createRadialGradient(w / 2, -h * 0.15, 0, w / 2, -h * 0.15, h * 0.95)
    rg.addColorStop(0, 'rgba(140, 225, 255, 0.22)')
    rg.addColorStop(1, 'rgba(140, 225, 255, 0)')
    ctx.fillStyle = rg
    ctx.fillRect(0, 0, w, h)
  }

  _drawRays(ctx) {
    const { w, h } = this
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const r of this.rays) {
      const flow = 0.5 + 0.5 * Math.sin(this.t * r.speed + r.phase)
      const a = r.alpha * (0.4 + 0.6 * flow)
      const topX = r.x + Math.sin(this.t * 0.1 + r.phase) * w * 0.02
      const dx = Math.tan(r.angle) * h
      ctx.beginPath()
      ctx.moveTo(topX - r.width / 2, 0)
      ctx.lineTo(topX + r.width / 2, 0)
      ctx.lineTo(topX + dx + r.width * 1.4, h)
      ctx.lineTo(topX + dx - r.width * 1.4, h)
      ctx.closePath()
      const g = ctx.createLinearGradient(topX, 0, topX + dx, h)
      g.addColorStop(0, `rgba(180, 235, 255, ${a})`)
      g.addColorStop(0.7, `rgba(150, 220, 255, ${a * 0.35})`)
      g.addColorStop(1, 'rgba(150, 220, 255, 0)')
      ctx.fillStyle = g
      ctx.fill()
    }
    ctx.restore()
  }

  _drawCaustics(ctx) {
    const tex = this._caustics
    if (!tex) return
    const { w, h } = this
    ctx.save()
    ctx.globalCompositeOperation = 'soft-light'
    // 两层反向缓慢平移 + 明暗呼吸，营造流动的水面焦散
    const layers = [
      { sx: (this.t * 9) % 256, sy: (this.t * 5) % 256, scale: 1.6, a: 0.9 },
      { sx: (-this.t * 6) % 256, sy: (this.t * 4) % 256, scale: 2.4, a: 0.6 },
    ]
    for (const L of layers) {
      const tile = 256 * L.scale
      ctx.globalAlpha = L.a * (0.6 + 0.4 * Math.sin(this.t * 0.5 + L.scale))
      for (let x = -tile + (L.sx % tile); x < w; x += tile) {
        for (let y = -tile + (L.sy % tile); y < h * 0.75; y += tile) {
          ctx.drawImage(tex, x, y, tile, tile)
        }
      }
    }
    ctx.restore()
  }

  _drawRidge(ctx, ridge) {
    const { h } = this
    const off = Math.sin(this.t * 0.08 + ridge.phase) * ridge.drift
    ctx.beginPath()
    ctx.moveTo(-40, h)
    for (const p of ridge.pts) ctx.lineTo(p.x + off, p.y)
    ctx.lineTo(this.w + 40, h)
    ctx.closePath()
    ctx.fillStyle = ridge.color
    ctx.fill()
  }

  _drawReef(ctx) {
    this._drawRidge(ctx, this.reefFar)
    // 珊瑚簇（画在远景之上、中景之下）
    ctx.save()
    for (const c of this.corals) {
      const sway = Math.sin(this.t * 0.6 + c.phase) * 2
      ctx.fillStyle = `hsla(${c.hue}, 45%, 22%, 0.7)`
      for (let b = 0; b < 5; b++) {
        const a = (b / 4 - 0.5) * 1.1
        ctx.save()
        ctx.translate(c.x + sway, c.y)
        ctx.rotate(a)
        ctx.beginPath()
        ctx.ellipse(0, -c.s * 0.5, c.s * 0.16, c.s * 0.55, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
    ctx.restore()
    this._drawRidge(ctx, this.reefMid)
  }

  _drawSeaweed(ctx) {
    const { h } = this
    ctx.save()
    for (const wd of this.weeds) {
      ctx.strokeStyle = `hsla(${wd.hue}, 55%, 32%, ${wd.alpha})`
      ctx.lineWidth = wd.segW
      ctx.lineCap = 'round'
      ctx.beginPath()
      const baseY = h
      ctx.moveTo(wd.x, baseY)
      const segs = 8
      for (let s = 1; s <= segs; s++) {
        const f = s / segs
        const yy = baseY - wd.h * f
        const bend = Math.sin(this.t * wd.freq + wd.phase + f * 2.2) * wd.amp * f
        ctx.lineTo(wd.x + bend, yy)
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  _drawMotes(ctx, motes, dt) {
    const { w, h } = this
    ctx.save()
    for (const m of motes) {
      m.y += m.vy * dt
      m.x += (m.vx + Math.sin(this.t * 0.6 + m.ph) * 4) * dt
      if (m.y < -4) {
        m.y = h + 4
        m.x = Math.random() * w
      }
      ctx.globalAlpha = m.alpha * (0.6 + 0.4 * Math.sin(this.t * 1.5 + m.ph))
      ctx.fillStyle = 'rgba(200, 240, 255, 1)'
      ctx.beginPath()
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  _drawVignette(ctx) {
    const { w, h } = this
    const rg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72)
    rg.addColorStop(0, 'rgba(0, 0, 0, 0)')
    rg.addColorStop(1, 'rgba(0, 10, 20, 0.42)')
    ctx.fillStyle = rg
    ctx.fillRect(0, 0, w, h)
  }
}

export default Seabed

