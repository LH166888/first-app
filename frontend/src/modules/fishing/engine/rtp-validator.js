/**
 * RTP Validator - 蒙特卡洛模拟验证脚本
 * 用于验证游戏配置是否满足RTP目标（92%-96%）
 *
 * 使用方式：
 * node rtp-validator.js --iterations 100000
 *
 * RTP = 长期吐出金币 / 投入金币
 */

const config = require('../config/games-fishing-config.json')

class RTPValidator {
  constructor(iterations = 100000) {
    this.iterations = iterations
    this.totalBulletsFired = 0
    this.totalCoinsWon = 0
    this.simulationResults = []
  }

  /**
   * 基于炮倍和鱼的捕获率公式
   * catch_rate = base_catch_rate * amplification_coefficient[cannon_multiplier]
   */
  calculateCatchRate(baseCatchRate, cannonMultiplier) {
    const amplification = config.cannon_mechanics.catch_rate_amplification
    const coefficient = amplification[`${cannonMultiplier}x`] || 1.0
    return Math.min(1.0, baseCatchRate * coefficient)
  }

  /**
   * 模拟单发子弹的结果
   */
  simulateSingleShot(cannonMultiplier = 1) {
    // 1. 消耗1发子弹（按炮倍消耗金币）
    const bulletCost = config.cannon_mechanics.cannon_cost_per_shot * cannonMultiplier
    this.totalBulletsFired += bulletCost

    // 2. 随机选择一条鱼
    const fish = this.selectRandomFish()

    // 3. 根据炮倍调整捕获率
    const catchRate = this.calculateCatchRate(fish.base_catch_rate_1x, cannonMultiplier)

    // 4. 判断是否捕获
    if (Math.random() < catchRate) {
      // 捕获成功：吐出金币
      const coinsWon = fish.payout_multiplier * cannonMultiplier
      this.totalCoinsWon += coinsWon
      return {
        caught: true,
        fishId: fish.id,
        coinsWon: coinsWon,
        bulletCost: bulletCost
      }
    }

    return {
      caught: false,
      fishId: fish.id,
      coinsWon: 0,
      bulletCost: bulletCost
    }
  }

  /**
   * 根据权重随机选择鱼种
   */
  selectRandomFish() {
    const rand = Math.random()
    let cumulative = 0

    for (const fish of config.fish_species) {
      cumulative += fish.spawn_weight
      if (rand <= cumulative) {
        return fish
      }
    }

    return config.fish_species[0]
  }

  /**
   * 模拟一个完整游戏会话
   * 玩家从3000金币开始，直到金币打光
   */
  simulateGameSession(initialCoins = 3000, cannonStrategy = 'balanced') {
    let sessionCoins = initialCoins
    let sessionBulletsFired = 0
    let sessionCoinsWon = 0
    const strategy = this.getCannonStrategy(cannonStrategy)

    while (sessionCoins > 0) {
      const cannonMult = strategy(sessionCoins, this.totalCoinsWon)
      const bulletCost = config.cannon_mechanics.cannon_cost_per_shot * cannonMult

      if (sessionCoins < bulletCost) break

      // 模拟射击
      const oldCoinsWon = this.totalCoinsWon
      this.simulateSingleShot(cannonMult)
      const deltaCoinsWon = this.totalCoinsWon - oldCoinsWon

      sessionCoins += deltaCoinsWon - bulletCost
      sessionBulletsFired += bulletCost
      sessionCoinsWon += deltaCoinsWon
    }

    return {
      bulletsFired: sessionBulletsFired,
      coinsWon: sessionCoinsWon,
      endCoins: Math.max(0, sessionCoins)
    }
  }

  /**
   * 获取炮倍策略
   * - 'balanced'：平衡使用1x-10x炮
   * - 'aggressive'：优先高倍炮
   * - 'conservative'：主要用1-2倍炮
   */
  getCannonStrategy(strategyName) {
    const strategies = {
      balanced: (coins, totalWon) => {
        const rand = Math.random()
        if (rand < 0.4) return 1
        if (rand < 0.7) return 2
        if (rand < 0.9) return 5
        return 10
      },
      aggressive: (coins, totalWon) => {
        return Math.random() < 0.3 ? 10 : 5
      },
      conservative: (coins, totalWon) => {
        return Math.random() < 0.7 ? 1 : 2
      }
    }

    return strategies[strategyName] || strategies.balanced
  }

  /**
   * 运行完整的蒙特卡洛模拟
   */
  run(strategies = ['balanced']) {
    const results = {}

    for (const strategy of strategies) {
      console.log(`\n🎮 Running simulation with strategy: ${strategy}`)
      console.log(`📊 Total iterations: ${this.iterations}`)

      this.totalBulletsFired = 0
      this.totalCoinsWon = 0
      let sessionCount = 0

      for (let i = 0; i < this.iterations; i++) {
        const session = this.simulateGameSession(3000, strategy)
        sessionCount++

        if ((i + 1) % 10000 === 0) {
          console.log(`  Progress: ${i + 1}/${this.iterations}...`)
        }
      }

      const rtp = this.totalCoinsWon / this.totalBulletsFired

      results[strategy] = {
        rtp: rtp,
        rtpPercent: (rtp * 100).toFixed(2) + '%',
        totalBulletsFired: this.totalBulletsFired,
        totalCoinsWon: Math.floor(this.totalCoinsWon),
        avgSessionCount: sessionCount,
        status: this.validateRTP(rtp)
      }
    }

    return results
  }

  /**
   * 验证RTP是否在目标范围内
   */
  validateRTP(rtp) {
    const min = 0.92
    const max = 0.96

    if (rtp < min) return `❌ LOW RTP (${(rtp * 100).toFixed(2)}% < 92%)`
    if (rtp > max) return `⚠️ HIGH RTP (${(rtp * 100).toFixed(2)}% > 96%)`
    return `✅ VALID (${(rtp * 100).toFixed(2)}% in [92%, 96%])`
  }

  /**
   * 打印验证报告
   */
  printReport(results) {
    console.log('\n' + '='.repeat(60))
    console.log('🎲 RTP VALIDATION REPORT')
    console.log('='.repeat(60))

    for (const [strategy, data] of Object.entries(results)) {
      console.log(`\n📋 Strategy: ${strategy.toUpperCase()}`)
      console.log(`   RTP: ${data.rtpPercent} (${data.rtpStatus})`)
      console.log(`   Total Bullets: ${data.totalBulletsFired}`)
      console.log(`   Total Coins Won: ${data.totalCoinsWon}`)
      console.log(`   Status: ${data.status}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('📌 RECOMMENDATION')
    console.log('='.repeat(60))

    const allValid = Object.values(results).every(r => r.status.startsWith('✅'))
    if (allValid) {
      console.log('✅ All strategies pass RTP validation!')
      console.log('   Configuration is ready for deployment.')
    } else {
      console.log('❌ Some strategies fail RTP validation!')
      console.log('   Adjust fish payout multipliers or spawn weights.')
      console.log('   See adjustment levers in config file.')
    }

    console.log('\n' + '='.repeat(60))
  }
}

// Main execution
if (typeof module !== 'undefined' && require.main === module) {
  const args = process.argv.slice(2)
  let iterations = 100000

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--iterations' && args[i + 1]) {
      iterations = parseInt(args[i + 1], 10)
    }
  }

  const validator = new RTPValidator(iterations)
  const results = validator.run(['balanced', 'aggressive', 'conservative'])
  validator.printReport(results)
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RTPValidator
}
