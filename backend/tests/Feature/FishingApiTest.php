<?php

namespace Tests\Feature;

use App\Models\GamesScore;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FishingApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeScore(User $user, int $score, int $coinsWon = null): GamesScore
    {
        return GamesScore::create([
            'user_id'   => $user->id,
            'score'     => $score,
            'coins_won' => $coinsWon ?? $score,
            'played_at' => now(),
        ]);
    }

    public function test_store_saves_score_and_returns_rank(): void
    {
        $other = User::factory()->create();
        $me    = User::factory()->create();

        // 已有两条更高分，本局应排第 3
        $this->makeScore($other, 50000);
        $this->makeScore($other, 30000);

        Sanctum::actingAs($me);

        $res = $this->postJson('/api/games/fishing/scores', [
            'score'     => 12500,
            'coins_won' => 12500,
        ]);

        $res->assertCreated()
            ->assertJsonPath('data.score', 12500)
            ->assertJsonPath('data.rank', 3)
            ->assertJsonPath('meta.message', '成绩已保存')
            ->assertJsonStructure(['data' => ['id', 'score', 'rank', 'created_at'], 'meta' => ['message']]);

        $this->assertDatabaseHas('games_scores', [
            'user_id'   => $me->id,
            'score'     => 12500,
            'coins_won' => 12500,
        ]);
    }

    public function test_store_rejects_anticheat_over_threshold(): void
    {
        config(['games.fishing.max_score' => 500000]);
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $res = $this->postJson('/api/games/fishing/scores', [
            'score'     => 500001,
            'coins_won' => 500001,
        ]);

        $res->assertStatus(422)
            ->assertJsonPath('errors.score.0', '分数异常，可能的作弊行为');

        $this->assertDatabaseCount('games_scores', 0);
    }

    public function test_store_validates_required_and_range(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        // 缺字段
        $this->postJson('/api/games/fishing/scores', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['score', 'coins_won']);

        // 负数 / 超范围
        $this->postJson('/api/games/fishing/scores', ['score' => -1, 'coins_won' => 1000000])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['score', 'coins_won']);
    }

    public function test_store_is_throttled_per_user(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        // 前 5 次成功
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/games/fishing/scores', ['score' => 100, 'coins_won' => 100])
                ->assertCreated();
        }

        // 第 6 次被限流
        $this->postJson('/api/games/fishing/scores', ['score' => 100, 'coins_won' => 100])
            ->assertStatus(429);
    }

    public function test_leaderboard_orders_by_score_desc_with_meta(): void
    {
        // 造 12 个玩家各一条成绩，分数 1200,1100,...,100
        $users = [];
        for ($i = 12; $i >= 1; $i--) {
            $u = User::factory()->create(['name' => "玩家{$i}"]);
            $this->makeScore($u, $i * 100);
            $users[$i] = $u;
        }

        // 当前用户排在中间（最高分 650 → 高于它的有 7 条：1200..700）
        $me = User::factory()->create();
        $this->makeScore($me, 650);

        Sanctum::actingAs($me);

        $res = $this->getJson('/api/games/fishing/leaderboard');

        $res->assertOk()
            ->assertJsonCount(10, 'data')                 // 固定 TOP10
            ->assertJsonPath('data.0.rank', 1)
            ->assertJsonPath('data.0.score', 1200)
            ->assertJsonPath('data.9.rank', 10)
            ->assertJsonPath('data.9.score', 400)         // TOP10：1200..700,650,600,500,400
            ->assertJsonPath('data.6.score', 650)         // 我的 650 排在第 7 位
            ->assertJsonPath('meta.current_rank', 7)      // 650 前面有 6 条更高分
            ->assertJsonPath('meta.current_user_score', 650)
            ->assertJsonPath('meta.total_players', 13);   // 12 + 我
    }

    public function test_my_stats_aggregates_correctly(): void
    {
        $me = User::factory()->create();
        $this->makeScore($me, 10000, 12000);
        $this->makeScore($me, 30000, 40000);
        $this->makeScore($me, 20000, 25000);

        Sanctum::actingAs($me);

        $res = $this->getJson('/api/games/fishing/me');

        $res->assertOk()
            ->assertJsonPath('data.highest_score', 30000)
            ->assertJsonPath('data.total_coins_won', 77000)   // 12000+40000+25000
            ->assertJsonPath('data.total_games', 3)
            ->assertJsonPath('data.avg_score', 20000)         // (10000+30000+20000)/3
            ->assertJsonPath('meta.message', 'success');
    }

    public function test_my_stats_defaults_to_zero_when_no_games(): void
    {
        $me = User::factory()->create();
        Sanctum::actingAs($me);

        $this->getJson('/api/games/fishing/me')
            ->assertOk()
            ->assertJsonPath('data.highest_score', 0)
            ->assertJsonPath('data.total_games', 0)
            ->assertJsonPath('data.avg_score', 0);
    }

    public function test_endpoints_require_authentication(): void
    {
        $this->postJson('/api/games/fishing/scores', ['score' => 1, 'coins_won' => 1])->assertStatus(401);
        $this->getJson('/api/games/fishing/leaderboard')->assertStatus(401);
        $this->getJson('/api/games/fishing/me')->assertStatus(401);
    }
}
