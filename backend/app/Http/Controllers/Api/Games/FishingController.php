<?php

namespace App\Http\Controllers\Api\Games;

use App\Http\Controllers\Controller;
use App\Http\Requests\Games\StoreFishingScoreRequest;
use App\Models\GamesScore;
use Illuminate\Http\Request;

class FishingController extends Controller
{
    /**
     * 提交本局成绩。
     * 校验（含反作弊阈值）在 StoreFishingScoreRequest 完成。
     * rank = 严格高于本局分数的成绩条数 + 1（并列同分取相同名次）。
     * 返回 { data:{id,score,rank,created_at}, meta:{message} }，状态码 201。
     */
    public function store(StoreFishingScoreRequest $request)
    {
        $data = $request->validated();

        $score = GamesScore::create([
            'user_id'   => $request->user()->id,
            'score'     => $data['score'],
            'coins_won' => $data['coins_won'],
            'played_at' => now(),
        ]);

        $rank = GamesScore::where('score', '>', $score->score)->count() + 1;

        return response()->json([
            'data' => [
                'id'         => $score->id,
                'score'      => $score->score,
                'rank'       => $rank,
                'created_at' => $score->created_at,
            ],
            'meta' => ['message' => '成绩已保存'],
        ], 201);
    }

    /**
     * 排行榜 TOP10（按 score 降序，同分按时间新者靠前）。
     * meta 附带当前用户的名次、最高分与总玩家数。
     * 返回 { data:[{rank,user_id,user_name,score,coins_won,played_at}], meta:{...} }。
     */
    public function leaderboard(Request $request)
    {
        $top = GamesScore::with('user:id,name')
            ->orderByDesc('score')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (GamesScore $item, int $index) => [
                'rank'      => $index + 1,
                'user_id'   => $item->user_id,
                'user_name' => $item->user?->name,
                'score'     => $item->score,
                'coins_won' => $item->coins_won,
                'played_at' => $item->played_at,
            ]);

        $userId = $request->user()->id;
        // 当前用户历史最高分；从未游戏则 null。
        $highest = GamesScore::where('user_id', $userId)->max('score');

        $currentRank = $highest === null
            ? null
            : GamesScore::where('score', '>', $highest)->count() + 1;

        return response()->json([
            'data' => $top,
            'meta' => [
                'current_rank'       => $currentRank,
                'current_user_score' => (int) ($highest ?? 0),
                // 至少有一条成绩的去重玩家数
                'total_players'      => GamesScore::distinct('user_id')->count('user_id'),
            ],
        ]);
    }

    /**
     * 当前用户的个人数据统计：最高分、累计捕获金币、总局数、平均分。
     * 返回 { data:{highest_score,total_coins_won,total_games,avg_score}, meta:{message} }。
     */
    public function myStats(Request $request)
    {
        $stats = GamesScore::where('user_id', $request->user()->id)
            ->selectRaw('MAX(score) as highest_score, SUM(coins_won) as total_coins_won, COUNT(*) as total_games, AVG(score) as avg_score')
            ->first();

        return response()->json([
            'data' => [
                'highest_score'   => (int) ($stats->highest_score ?? 0),
                'total_coins_won' => (int) ($stats->total_coins_won ?? 0),
                'total_games'     => (int) ($stats->total_games ?? 0),
                'avg_score'       => (int) round($stats->avg_score ?? 0),
            ],
            'meta' => ['message' => 'success'],
        ]);
    }
}
