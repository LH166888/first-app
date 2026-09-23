<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GamesScore extends Model
{
    protected $fillable = [
        'user_id',
        'score',
        'coins_won',
        'played_at',
    ];

    protected $casts = [
        'score'     => 'integer',
        'coins_won' => 'integer',
        'played_at' => 'datetime',
    ];

    // 成绩归属的玩家
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
