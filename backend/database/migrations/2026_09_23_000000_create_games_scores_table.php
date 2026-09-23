<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fishing 游戏成绩表：每一局游戏一行记录。
     * score      = 本局净胜金币（排行榜排序依据）
     * coins_won  = 本局捕获总金币（用于个人累计统计）
     * played_at  = 游戏发生时间（与 created_at 冗余，便于前端展示对局时间）
     */
    public function up(): void
    {
        Schema::create('games_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('score')->comment('本局净胜金币');
            $table->unsignedInteger('coins_won')->comment('本局捕获总金币');
            $table->dateTime('played_at')->comment('游戏时间');
            $table->timestamps();

            // 查询用户历史（我的数据 / 我的对局）
            $table->index(['user_id', 'created_at']);
            // 排行榜排序（score DESC）。B-Tree 索引同时服务升/降序，无需单列 DESC 索引。
            $table->index('score');
            // 最近游戏
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('games_scores');
    }
};
