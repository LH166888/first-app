/**
 * AI-17 四档炮倍 RTP 验证（每档固定 100,000 发）
 * node rtp-by-cannon.cjs
 */
const config = require('../config/games-fishing-config.json')

const SHOTS = 500_000
const MULTIPLIERS = [1, 2, 5, 10]

function selectFish() {
  const r = Math.random()
  let cum = 0
  for (const f of config.fish_species) {
    cum += f.spawn_weight
    if (r <= cum) return f
  }
  return config.fish_species[0]
}

function catchRate(baseCatchRate, mult) {
  const amp = config.cannon_mechanics.catch_rate_amplification
  const coeff = amp[`${mult}x`] ?? 1.0
  return Math.min(1.0, baseCatchRate * coeff)
}

console.log('='.repeat(62))
console.log('AI-17 四档炮倍 RTP 验证  （每档 500,000 发）')
console.log('='.repeat(62))

let allPass = true

for (const mult of MULTIPLIERS) {
  let totalCost = 0
  let totalWon = 0

  for (let i = 0; i < SHOTS; i++) {
    const cost = config.cannon_mechanics.cannon_cost_per_shot * mult
    totalCost += cost
    const fish = selectFish()
    const rate = catchRate(fish.base_catch_rate_1x, mult)
    if (Math.random() < rate) {
      totalWon += fish.payout_multiplier * mult
    }
  }

  const rtp = totalWon / totalCost
  const pct = (rtp * 100).toFixed(2)
  const pass = rtp >= 0.92 && rtp <= 0.96
  const tag = pass ? '✅ PASS' : (rtp < 0.92 ? '❌ LOW ' : '⚠️  HIGH')
  if (!pass) allPass = false
  console.log(`${String(mult).padStart(2)}x 炮  RTP: ${pct.padStart(6)}%  ${tag}  (赢:${totalWon} / 投:${totalCost})`)
}

console.log('='.repeat(62))
console.log(allPass ? '✅ 四档全部通过 92%-96% 目标' : '❌ 存在未通过档位，需调整配置')
console.log('='.repeat(62))
