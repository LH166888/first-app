/**
 * 游戏主控（状态机 + requestAnimationFrame 循环）
 *
 * 组合 physics（数值）、renderer（渲染）、sound（音效），维护实体与结算。
 * 关键约束：本类完全不依赖 Vue 响应式，逐帧 update/render 只操作普通对象；
 * 与界面的通信一律通过构造时传入的回调（且只在「离散事件」触发，避免每帧刷新 Vue）。
 *
 * 状态：'idle' | 'running' | 'paused' | 'over'
 *
 * 对外 API：
 *   start(coins) / pause() / resume() / togglePause() / destroy()
 *   setMultiplier(m) / aimAt(x, y) / fire()
 */
import config from '../config/games-fishing-config.json'
import { Renderer } from './renderer'
import { SoundManager } from './sound'
import * as P from './physics'

const AMP = config.cannon_mechanics.catch_rate_amplification
const COST_PER_SHOT = config.cannon_mechanics.cannon_cost_per_shot
const SPECIES = config.fish_species
const MAX_FISH = 14 // 屏上最大鱼数，控制性能与观感

export class FishingGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.w = canvas.width
    this.h = canvas.height

    this.renderer = new Renderer(this.ctx, this.w, this.h)
    this.sound = new SoundManager()

    this.cb = {
      onUpdate: callbacks.onUpdate || (() => {}), // ({coins, score, coinsWon, stats})
      onGameOver: callbacks.onGameOver || (() => {}), // (result)
      onCannotAfford: callbacks.onCannotAfford || (() => {}), // ()
    }

    this.status = 'idle'
    this.fishes = []
    this.bullets = []
    this.effects = []

    this.cannon = {
      x: this.w / 2,
      y: this.h - 24,
      angle: -Math.PI / 2,
      barrelLength: 40,
      multiplier: 1,
    }
    this.aim = { x: this.w / 2, y: this.h / 2 }

    this._reset()

    this._rafId = null
    this._lastTs = 0
    this._spawnTimer = 0
    this._spawnInterval = 0.9 // 秒
    this._loop = this._loop.bind(this)
  }

  _reset() {
    this.coins = 0
    this.coinsWon = 0
    this.coinsSpent = 0
    this.stats = { fishCaught: 0, bulletsShot: 0 }
    this.fishes = []
    this.bullets = []
    this.effects = []
    this._spawnTimer = 0
  }

  get score() {
    // 净胜金币（本局），可为负；上报时再做下限裁剪
    return this.coinsWon - this.coinsSpent
  }

  resize(w, h) {
    this.w = this.canvas.width = w
    this.h = this.canvas.height = h
    this.cannon.x = w / 2
    this.cannon.y = h - 24
    this.renderer.resize(w, h)
  }

  start(coins) {
    this._reset()
    this.coins = coins
    this.status = 'running'
    this._lastTs = 0
    this._emitUpdate()
    if (!this._rafId) this._rafId = requestAnimationFrame(this._loop)
  }

  pause() {
    if (this.status === 'running') this.status = 'paused'
  }

  resume() {
    if (this.status === 'paused') {
      this.status = 'running'
      this._lastTs = 0
    }
  }

  togglePause() {
    if (this.status === 'running') this.pause()
    else if (this.status === 'paused') this.resume()
  }

  setMultiplier(m) {
    if (config.cannon_mechanics.multipliers.includes(m)) {
      this.cannon.multiplier = m
      this._emitUpdate()
    }
  }

  aimAt(x, y) {
    this.aim.x = x
    this.aim.y = y
    this.cannon.angle = Math.atan2(y - this.cannon.y, x - this.cannon.x)
  }

  fire() {
    if (this.status !== 'running') return
    const cost = P.shotCost(this.cannon.multiplier, COST_PER_SHOT)

    if (this.coins < cost) {
      // 当前炮倍打不起：若连最小炮都打不起 → 结束；否则提示降炮倍
      if (this.coins < P.shotCost(1, COST_PER_SHOT)) {
        this._gameOver()
      } else {
        this.cb.onCannotAfford()
      }
      return
    }

    this.coins -= cost
    this.coinsSpent += cost
    this.stats.bulletsShot++
    this.sound.play('shoot')

    const tipX = this.cannon.x + Math.cos(this.cannon.angle) * this.cannon.barrelLength
    const tipY = this.cannon.y + Math.sin(this.cannon.angle) * this.cannon.barrelLength
    this.bullets.push(P.spawnBullet(tipX, tipY, this.aim.x, this.aim.y, this.cannon.multiplier))

    this._emitUpdate()
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId)
    this._rafId = null
    this.status = 'idle'
    this.sound.destroy()
  }

  // ---- 内部循环 ----

  _loop(ts) {
    this._rafId = requestAnimationFrame(this._loop)
    if (this._lastTs === 0) this._lastTs = ts
    let dt = (ts - this._lastTs) / 1000
    this._lastTs = ts
    if (dt > 0.05) dt = 0.05 // 卡顿保护，避免穿模

    if (this.status === 'running') this._update(dt)
    // 暂停/结束也继续渲染（呈现暂停遮罩/最后一帧）
    this.renderer.render(
      {
        fishes: this.fishes,
        bullets: this.bullets,
        effects: this.effects,
        cannon: this.cannon,
        aim: this.aim,
        paused: this.status === 'paused',
      },
      dt
    )
  }

  _update(dt) {
    // 生成鱼
    this._spawnTimer += dt
    if (this._spawnTimer >= this._spawnInterval && this.fishes.length < MAX_FISH) {
      this._spawnTimer = 0
      const sp = P.pickSpecies(SPECIES)
      this.fishes.push(P.spawnFish(sp, this.w, this.h))
    }

    // 子弹推进 + 碰撞
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]
      const alive = P.stepBullet(b, dt, this.w, this.h)
      if (!alive) {
        this.bullets.splice(i, 1)
        continue
      }
      for (let j = this.fishes.length - 1; j >= 0; j--) {
        if (P.isHit(b, this.fishes[j])) {
          this._resolveHit(b, this.fishes[j], i, j)
          break
        }
      }
    }

    // 鱼推进
    for (let i = this.fishes.length - 1; i >= 0; i--) {
      const f = this.fishes[i]
      if (f.hitFlash > 0) f.hitFlash -= dt // 纯表现：受击白闪计时衰减，不参与任何数值
      if (!P.stepFish(f, dt, this.w, this.h)) this.fishes.splice(i, 1)
    }

    // 特效推进
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i]
      e.life -= dt
      e.x += (e.vx || 0) * dt
      e.y += (e.vy || 0) * dt
      if (e.vy != null) e.vy += 160 * dt // coin 受重力
      if (e.life <= 0) this.effects.splice(i, 1)
    }
  }

  _resolveHit(bullet, fish, bulletIdx, fishIdx) {
    this.bullets.splice(bulletIdx, 1)
    this.sound.play('hit')

    fish.hitFlash = 0.22 // 受击视觉反馈（抖动/白闪），纯表现，不影响判定

    const rate = P.catchRate(fish.baseCatchRate, bullet.multiplier, AMP)
    if (Math.random() < rate) {
      this._capture(fish, fishIdx, bullet.multiplier)
    } else {
      this.effects.push({ type: 'hit', x: fish.x, y: fish.y, life: 0.3, maxLife: 0.3, seed: Math.random() * Math.PI * 2 })
    }
  }

  _capture(fish, fishIdx, multiplier) {
    const won = P.payout(fish.payout, multiplier)
    this.coins += won
    this.coinsWon += won
    this.stats.fishCaught++
    this.sound.play('capture')
    this.sound.play('coin')

    this.fishes.splice(fishIdx, 1)
    this.effects.push({ type: 'float', x: fish.x, y: fish.y, text: `+${won}`, color: '#ffd166', life: 0.9, maxLife: 0.9, vy: -40 })
    this._spawnCoinBurst(fish.x, fish.y, won)

    // 特殊鱼效果
    if (fish.specialEffect === 'coin_rain') {
      this._coinRain(fish.x)
    } else if (fish.specialEffect === 'chain_explosion') {
      this._chainExplosion(fish.x, fish.y, multiplier)
    } else if (fish.specialEffect === 'splash_radius') {
      this._splash(fish.x, fish.y, multiplier)
    }

    this._emitUpdate()
  }

  // 河豚：小范围溅射，捡漏范围内小鱼（低概率）
  _splash(x, y, multiplier) {
    const R = 80
    for (let i = this.fishes.length - 1; i >= 0; i--) {
      const f = this.fishes[i]
      if ((f.x - x) ** 2 + (f.y - y) ** 2 <= R * R && f.payout <= 4) {
        if (Math.random() < 0.5) this._capture(f, i, multiplier)
      }
    }
  }

  // 灯笼鱼：引爆周围小鱼（payout<=4 必中）
  _chainExplosion(x, y, multiplier) {
    const R = 130
    for (let i = this.fishes.length - 1; i >= 0; i--) {
      const f = this.fishes[i]
      if ((f.x - x) ** 2 + (f.y - y) ** 2 <= R * R && f.payout <= 4) {
        this._capture(f, i, multiplier)
      }
    }
    this.effects.push({ type: 'hit', x, y, life: 0.5, maxLife: 0.5 })
  }

  // 元宝鱼：金币雨（纯观感）
  _coinRain(x) {
    for (let i = 0; i < 18; i++) {
      this.effects.push({
        type: 'coin',
        x: x + (Math.random() - 0.5) * 160,
        y: -10 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 30,
        vy: Math.random() * 40,
        life: 1.6,
        maxLife: 1.6,
      })
    }
  }

  _spawnCoinBurst(x, y, amount) {
    const n = Math.min(8, 3 + Math.floor(amount / 10))
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n
      this.effects.push({
        type: 'coin',
        x,
        y,
        vx: Math.cos(a) * 60,
        vy: Math.sin(a) * 60 - 40,
        life: 0.7,
        maxLife: 0.7,
      })
    }
  }

  _gameOver() {
    if (this.status === 'over') return
    this.status = 'over'
    this.cb.onGameOver(this._result())
  }

  _result() {
    return {
      score: Math.max(0, this.score),
      coinsWon: this.coinsWon,
      coinsSpent: this.coinsSpent,
      coinsLeft: this.coins,
      fishCaught: this.stats.fishCaught,
      bulletsShot: this.stats.bulletsShot,
    }
  }

  _emitUpdate() {
    this.cb.onUpdate({
      coins: this.coins,
      score: this.score,
      coinsWon: this.coinsWon,
      multiplier: this.cannon.multiplier,
      stats: { ...this.stats },
    })
  }
}

export default FishingGame
