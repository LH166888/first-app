// 捕鱼榜单 / 战绩接口。复用全局 axios 实例（默认导出，自动带 Sanctum token）。
// 后端契约见 AI-10：统一 { data, meta } 信封，接口需登录（auth:sanctum）。
import client from '@/shared/api/client'

/**
 * 提交本局成绩。
 * @param {{score:number, coinsWon:number}} payload
 * @returns {Promise<{id, score, rank, createdAt}>}
 */
export async function submitScore({ score, coinsWon }) {
  const { data } = await client.post('/games/fishing/scores', {
    score: Math.round(score),
    coins_won: Math.round(coinsWon),
  })
  const d = data?.data || {}
  return { id: d.id, score: d.score, rank: d.rank, createdAt: d.created_at }
}

/**
 * 拉取榜单（默认 TOP10）与当前用户名次。
 * @returns {Promise<{list:Array, currentRank:number|null, currentScore:number|null, totalPlayers:number}>}
 */
export async function getLeaderboard() {
  const { data } = await client.get('/games/fishing/leaderboard')
  const meta = data?.meta || {}
  return {
    list: (data?.data || []).map((r) => ({
      rank: r.rank,
      userId: r.user_id,
      userName: r.user_name,
      score: r.score,
      coinsWon: r.coins_won,
      playedAt: r.played_at,
    })),
    currentRank: meta.current_rank ?? null,
    currentScore: meta.current_user_score ?? null,
    totalPlayers: meta.total_players ?? 0,
  }
}

/**
 * 拉取个人战绩。
 * @returns {Promise<{highestScore, totalCoinsWon, totalGames, avgScore}>}
 */
export async function getPlayerStats() {
  const { data } = await client.get('/games/fishing/me')
  const d = data?.data || {}
  return {
    highestScore: d.highest_score ?? 0,
    totalCoinsWon: d.total_coins_won ?? 0,
    totalGames: d.total_games ?? 0,
    avgScore: d.avg_score ?? 0,
  }
}
