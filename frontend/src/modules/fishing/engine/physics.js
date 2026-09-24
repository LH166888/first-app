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
 * 三次贝塞尔：给定 4 个控制点与参数 t∈[0,1]，返回曲线上的坐标。
 */
function cubicBezier(p0, p1, p2, p3, t) {
  const mt = 1 - t
  const a = mt * mt * mt
  const b = 3 * mt * mt * t
  const c = 3 * mt * t * t
  const d = t * t * t
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  }
}

/**
 * 三次贝塞尔的一阶导数（切线向量），用于确定鱼头朝向。
 */
function cubicBezierTangent(p0, p1, p2, p3, t) {
  const mt = 1 - t
  const a = 3 * mt * mt
  const b = 6 * mt * t
  const c = 3 * t * t
  return {
    x: a * (p1.x - p0.x) + b * (p2.x - p1.x) + c * (p3.x - p2.x),
    y: a * (p1.y - p0.y) + b * (p2.y - p1.y) + c * (p3.y - p2.y),
  }
}

/**
 * 为一条鱼生成一条穿越屏幕的贝塞尔曲线路径（4 个控制点）。
 * 起点/终点各自落在屏幕四条边之一（且不同边）的随机位置，方向任意（横/竖/斜）；
 * 中间两个控制点在连线基础上施加垂直偏移，形成自然的弧线/S 形。
 */
function generatePath(w, h, radius, rnd) {
  const margin = radius + 60
  // 在指定边上取屏幕外一点。edge: 0=上 1=右 2=下 3=左
  const pointOnEdge = (edge) => {
    switch (edge) {
      case 0: return { x: rnd() * w, y: -margin }           // 上边（屏幕外上方）
      case 1: return { x: w + margin, y: rnd() * h }         // 右边
      case 2: return { x: rnd() * w, y: h + margin }         // 下边
      default: return { x: -margin, y: rnd() * h }           // 左边
    }
  }

  // 随机入场边，出场边取另一条不同的边（0~3 里排除入场边）
  const inEdge = Math.floor(rnd() * 4)
  const outEdge = (inEdge + 1 + Math.floor(rnd() * 3)) % 4
  const p0 = pointOnEdge(inEdge)
  const p3 = pointOnEdge(outEdge)

  // 两个中间控制点：沿连线分布，并沿「连线法向」施加随机偏移形成弯曲。
  // 法向随连线方向旋转，故斜向轨迹也能自然弯曲。
  const lerp = (a, b, t) => a + (b - a) * t
  const dx = p3.x - p0.x
  const dy = p3.y - p0.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len // 连线法向单位向量
  const ny = dx / len
  const bend = (rnd() - 0.5) * len * 0.45  // 弯曲强度与连线长度成比例
  const bend2 = (rnd() - 0.5) * len * 0.45
  const p1 = { x: lerp(p0.x, p3.x, 0.33) + nx * bend, y: lerp(p0.y, p3.y, 0.33) + ny * bend }
  const p2 = { x: lerp(p0.x, p3.x, 0.66) + nx * bend2, y: lerp(p0.y, p3.y, 0.66) + ny * bend2 }

  return [p0, p1, p2, p3]
}

/**
 * 生成一条鱼。沿一条随机贝塞尔曲线穿越屏幕，朝向自动对齐曲线切线。
 * 大鱼（赔率高）体型更大、速度更慢（穿越时间更长）。
 */
export function spawnFish(species, w, h, rnd = Math.random) {
  // 体型：优先取 config 里各鱼自定义的 radius，未配置则回退按倍率计算的默认公式
  const radius = species.radius != null
    ? species.radius
    : 16 + Math.min(30, species.payout_multiplier * 0.35)
  // 速度：优先取 config 里各鱼自定义的 cross_seconds（穿屏秒数，越小越快），未配置则回退按倍率计算的默认公式
  const duration = species.cross_seconds != null
    ? species.cross_seconds
    : 30 + species.payout_multiplier * 0.17
  const path = generatePath(w, h, radius, rnd)

  const p = cubicBezier(path[0], path[1], path[2], path[3], 0)
  const tan = cubicBezierTangent(path[0], path[1], path[2], path[3], 0)

  return {
    id: `${species.id}-${Math.floor(rnd() * 1e9)}`,
    speciesId: species.id,
    payout: species.payout_multiplier,
    baseCatchRate: species.base_catch_rate_1x,
    specialEffect: species.special_effect || null,
    x: p.x,
    y: p.y,
    // 保留 vx 供旧逻辑/兼容（朝向以 angle 为准）
    vx: tan.x,
    vy: tan.y,
    angle: Math.atan2(tan.y, tan.x),
    radius,
    age: 0,
    path,
    duration,
    // 沿切线法向的轻微摆动，模拟鱼身自然游动（0 = 关闭，沿轨迹平滑前进）
    wobbleAmp: 0,
    wobbleFreq: 3 + rnd() * 2,
    phase: rnd() * Math.PI * 2,
  }
}

/**
 * 推进一条鱼一帧。沿贝塞尔曲线按 age/duration 前进，
 * 位置叠加沿法向的正弦摆动，朝向取曲线切线。
 * 返回是否仍存活（t<1 表示尚未走完全程）。
 */
export function stepFish(fish, dt, w, h) {
  fish.age += dt
  const t = fish.age / fish.duration
  if (t >= 1) return false // 走完整条曲线，回收

  const [p0, p1, p2, p3] = fish.path
  const pos = cubicBezier(p0, p1, p2, p3, t)
  const tan = cubicBezierTangent(p0, p1, p2, p3, t)
  fish.angle = Math.atan2(tan.y, tan.x)
  fish.vx = tan.x
  fish.vy = tan.y

  // 沿切线法向做正弦摆动（法向 = 切线旋转 90°，归一化后乘幅度）
  const len = Math.hypot(tan.x, tan.y) || 1
  const nx = -tan.y / len
  const ny = tan.x / len
  const wob = Math.sin(fish.age * fish.wobbleFreq + fish.phase) * fish.wobbleAmp
  fish.x = pos.x + nx * wob
  fish.y = pos.y + ny * wob

  return true
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
