/**
 * 物理与数值层（纯函数，无 Vue、无 Canvas、无副作用）
 *
 * 负责：鱼的出生参数与游动轨迹、子弹弹道、碰撞判定、捕获概率、金币结算。
 * 全部为纯计算，便于单测与蒙特卡洛校验复用（见 rtp-validator.js 的取数口径）。
 *
 * 单位约定：坐标 px；速度 px/秒；dt 秒。
 */

// 子弹飞行速度（px/秒）
export const BULLET_SPEED = 950

/**
 * 按 spawn_weight 加权随机选一个鱼种。
 * 权重之和未必为 1，这里按累计权重归一化处理，鲁棒于配置微调。
 */
export function pickSpecies(speciesList, rnd = Math.random) {
  const total = speciesList.reduce((s, f) => s + (f.spawn_weight || 0), 0)
  let r = rnd() * total
  for (const sp of speciesList) {
    r -= sp.spawn_weight || 0
    if (r <= 0) return sp
  }
  return speciesList[speciesList.length - 1]
}

/**
 * 生成一条鱼。从左/右/上三侧随机入场，沿直线水平/下潜移动，叠加正弦摆动。
 * 大鱼（赔率高）体型更大、速度更慢。
 */
export function spawnFish(species, w, h, rnd = Math.random) {
  const radius = 16 + Math.min(30, species.payout_multiplier * 0.35)
  // 赔率越高越慢：60~90 px/s 之间
  const baseSpeed = 90 - Math.min(45, species.payout_multiplier * 0.6)
  const side = Math.floor(rnd() * 3)

  let x, y, vx, vy
  if (side === 0) {
    // 左侧入场，向右游
    x = -radius
    y = rnd() * (h * 0.7) + h * 0.1
    vx = baseSpeed
    vy = 0
  } else if (side === 1) {
    // 右侧入场，向左游
    x = w + radius
    y = rnd() * (h * 0.7) + h * 0.1
    vx = -baseSpeed
    vy = 0
  } else {
    // 顶部入场，向下潜
    x = rnd() * w
    y = -radius
    vx = (rnd() - 0.5) * baseSpeed
    vy = baseSpeed * 0.6
  }

  return {
    id: `${species.id}-${Math.floor(rnd() * 1e9)}`,
    speciesId: species.id,
    payout: species.payout_multiplier,
    baseCatchRate: species.base_catch_rate_1x,
    specialEffect: species.special_effect || null,
    x,
    y,
    vx,
    vy,
    radius,
    age: 0,
    wobbleAmp: vy === 0 ? radius * 0.5 : 0, // 水平游动才上下摆
    wobbleFreq: 2 + rnd() * 2,
    phase: rnd() * Math.PI * 2,
  }
}

/**
 * 推进一条鱼一帧。返回是否仍在场内（false 表示已游出边界可回收）。
 */
export function stepFish(fish, dt, w, h) {
  fish.age += dt
  fish.x += fish.vx * dt
  const wob = fish.wobbleAmp ? Math.sin(fish.age * fish.wobbleFreq + fish.phase) * fish.wobbleAmp * dt * fish.wobbleFreq : 0
  fish.y += fish.vy * dt + wob

  const m = fish.radius + 40
  return fish.x > -m && fish.x < w + m && fish.y > -m && fish.y < h + m
}

/**
 * 生成一发子弹，从炮口沿瞄准方向射出。
 */
export function spawnBullet(originX, originY, aimX, aimY, multiplier) {
  const angle = Math.atan2(aimY - originY, aimX - originX)
  return {
    x: originX,
    y: originY,
    vx: Math.cos(angle) * BULLET_SPEED,
    vy: Math.sin(angle) * BULLET_SPEED,
    radius: 4 + multiplier * 0.4,
    multiplier,
    angle,
  }
}

/** 推进一发子弹一帧。返回是否仍在场内。 */
export function stepBullet(bullet, dt, w, h) {
  bullet.x += bullet.vx * dt
  bullet.y += bullet.vy * dt
  const m = 20
  return bullet.x > -m && bullet.x < w + m && bullet.y > -m && bullet.y < h + m
}

/** 圆-圆碰撞。 */
export function isHit(bullet, fish) {
  const dx = bullet.x - fish.x
  const dy = bullet.y - fish.y
  const rr = bullet.radius + fish.radius
  return dx * dx + dy * dy <= rr * rr
}

/**
 * 捕获概率 = 基础捕获率 × 炮倍放大系数，封顶 1.0。
 * 与 AI-11 数值口径一致：一次命中掷一次骰子（血量仅作视觉/难度提示，不做多段扣血）。
 */
export function catchRate(baseCatchRate, multiplier, amplificationMap) {
  const amp = amplificationMap[`${multiplier}x`] || 1.0
  return Math.min(1, baseCatchRate * amp)
}

/** 单发消耗 = 每发基础消耗 × 炮倍。 */
export function shotCost(multiplier, costPerShot) {
  return costPerShot * multiplier
}

/** 捕获吐分 = 鱼种赔率 × 炮倍。 */
export function payout(payoutMultiplier, multiplier) {
  return payoutMultiplier * multiplier
}
