import client from '../../../shared/api/client'

export async function submitScore(scoreData) {
  const { data } = await client.post('/games/fishing/scores', {
    score: scoreData.score,
    coins_won: scoreData.coinsWon,
    fish_caught: scoreData.fishCaught,
    bullets_shot: scoreData.bulletsShot
  })
  return data
}

export async function getLeaderboard(page = 1, limit = 10) {
  const { data } = await client.get('/games/fishing/leaderboard', {
    params: { page, limit }
  })
  return data
}

export async function getPlayerStats() {
  const { data } = await client.get('/games/fishing/me')
  return data
}
