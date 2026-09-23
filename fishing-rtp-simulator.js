// fishing-rtp-simulator.js
// 怀旧捕鱼游戏 RTP 蒙特卡洛验证脚本
// 运行: node fishing-rtp-simulator.js  (或直接粘贴到浏览器控制台)
//
// 设计模型说明：
// - 采用「单发独立捕获」概率模型：每发子弹对当前锁定鱼独立判定，命中即捕获并结算赔率。
// - 这是捕鱼类游戏做 RTP 平衡的标准简化模型，hp 作为难度/表现参考量（期望命中数≈1/p）。
// - 炮倍加成为「乘法型」：capture = base * (1 + k*(n-1))，避免高倍炮打大鱼时 EV 失控。
// - 特殊鱼(河豚溅射/元宝金币雨/灯笼连锁)通过 effectiveMultiplier 折算进有效赔率。

'use strict';

class FishingRTPSimulator {
  constructor(config = {}) {
    this.fishConfig = config.fish || this.defaultFishConfig();
    this.captureRateBonusPerLevel = config.captureRateBonusPerLevel ?? 0.004;
    this.targetRTP = config.targetRTP ?? 0.94;
    this.rtpTolerance = config.rtpTolerance ?? 0.02; // ±2%
    // 玩家炮倍使用分布（模拟真实行为：低倍为主，偶尔高倍冲大鱼）
    this.cannonDistribution = config.cannonDistribution || [1, 1, 1, 2, 2, 5, 10];
  }

  defaultFishConfig() {
    return {
      小黄鱼: { payout: 2, hp: 1, baseCapture: 0.443, weight: 0.40, eff: 1.0 },
      热带鱼: { payout: 4, hp: 2, baseCapture: 0.221, weight: 0.22, eff: 1.0 },
      河豚: { payout: 6, hp: 3, baseCapture: 0.148, weight: 0.14, eff: 1.3 },
      乌龟: { payout: 10, hp: 5, baseCapture: 0.087, weight: 0.10, eff: 1.0 },
      鲨鱼: { payout: 25, hp: 12, baseCapture: 0.034, weight: 0.06, eff: 1.0 },
      金龙: { payout: 60, hp: 25, baseCapture: 0.014, weight: 0.035, eff: 1.0 },
      元宝鱼: { payout: 60, hp: 8, baseCapture: 0.014, weight: 0.03, eff: 1.0 },
      灯笼鱼: { payout: 20, hp: 6, baseCapture: 0.042, weight: 0.015, eff: 1.5 },
    };
  }

  // 乘法型炮倍捕获率加成，并夹在 [0, 0.99]
  getAdjustedCaptureRate(baseRate, cannonMult) {
    const rate = baseRate * (1 + this.captureRateBonusPerLevel * (cannonMult - 1));
    return Math.min(rate, 0.99);
  }

  // 按权重随机选鱼（累积区间，兼容权重和≈1）
  selectFishByWeight() {
    const rand = Math.random();
    let cumulative = 0;
    const entries = Object.entries(this.fishConfig);
    for (const [name, cfg] of entries) {
      cumulative += cfg.weight;
      if (rand <= cumulative) return { name, ...cfg };
    }
    const [name, cfg] = entries[entries.length - 1]; // 兜底
    return { name, ...cfg };
  }

  // 单发射击结算
  simulateShot(cannonMult = 1) {
    const fish = this.selectFishByWeight();
    const cost = cannonMult; // 1 发子弹消耗 = 炮倍
    const captureRate = this.getAdjustedCaptureRate(fish.baseCapture, cannonMult);
    const isCaptured = Math.random() < captureRate;
    const eff = fish.eff ?? 1.0;
    const reward = isCaptured ? fish.payout * cannonMult * eff : 0;
    return { cost, reward, isCaptured, fishName: fish.name };
  }

  // RTP 验证主流程
  verifyRTP(iterations = 100000) {
    let totalCost = 0;
    let totalReward = 0;
    let captureCount = 0;
    const perFish = {};

    for (let i = 0; i < iterations; i++) {
      const cannonMult =
        this.cannonDistribution[Math.floor(Math.random() * this.cannonDistribution.length)];
      const { cost, reward, isCaptured, fishName } = this.simulateShot(cannonMult);
      totalCost += cost;
      totalReward += reward;
      if (isCaptured) captureCount++;
      if (!perFish[fishName]) perFish[fishName] = { shots: 0, captures: 0, reward: 0 };
      perFish[fishName].shots++;
      if (isCaptured) perFish[fishName].captures++;
      perFish[fishName].reward += reward;
    }

    const rtp = totalReward / totalCost;
    const min = this.targetRTP - this.rtpTolerance;
    const max = this.targetRTP + this.rtpTolerance;
    const passed = rtp >= min && rtp <= max;

    return {
      rtp: Number(rtp.toFixed(4)),
      totalCost: Math.round(totalCost),
      totalReward: Math.round(totalReward),
      captureCount,
      captureRate: (captureCount / iterations * 100).toFixed(2) + '%',
      targetRange: `${min.toFixed(2)} ~ ${max.toFixed(2)}`,
      passed,
      perFish,
      message: passed
        ? `✅ RTP 验证通过 (${rtp.toFixed(4)})`
        : `❌ RTP 验证失败 (${rtp.toFixed(4)})，超出目标 ${min.toFixed(2)} ~ ${max.toFixed(2)}`,
    };
  }

  // 分炮倍验证：确认高炮倍 ROI 不下降（应≥低炮倍）
  verifyByCannon(iterationsPerCannon = 50000, cannons = [1, 2, 5, 10]) {
    const out = {};
    for (const n of cannons) {
      let cost = 0, reward = 0;
      for (let i = 0; i < iterationsPerCannon; i++) {
        const r = this.simulateShot(n);
        cost += r.cost;
        reward += r.reward;
      }
      out[`${n}x`] = Number((reward / cost).toFixed(4));
    }
    return out;
  }
}

// -------- 运行入口（Node 环境自动执行） --------
if (typeof module !== 'undefined' && require.main === module) {
  const sim = new FishingRTPSimulator();
  const result = sim.verifyRTP(100000);
  console.log('=== 综合 RTP 验证 (混合炮倍分布) ===');
  console.log(JSON.stringify({
    rtp: result.rtp,
    captureRate: result.captureRate,
    targetRange: result.targetRange,
    passed: result.passed,
    message: result.message,
  }, null, 2));

  console.log('\n=== 分炮倍 ROI 验证 (应随炮倍非递减) ===');
  console.log(JSON.stringify(sim.verifyByCannon(), null, 2));

  console.log('\n=== 各鱼种命中统计 ===');
  for (const [name, s] of Object.entries(result.perFish)) {
    console.log(
      `${name.padEnd(4)} 出现率 ${(s.shots / 100000 * 100).toFixed(1)}% | ` +
      `捕获率 ${(s.captures / s.shots * 100).toFixed(1)}% | ` +
      `贡献奖池 ${(s.reward / result.totalReward * 100).toFixed(1)}%`
    );
  }
}

if (typeof module !== 'undefined') {
  module.exports = { FishingRTPSimulator };
}
