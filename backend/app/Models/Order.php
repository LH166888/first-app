<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'from_user_id',
        'to_user_id',
        'note',
        'items',
    ];

    protected $casts = [
        'items' => 'array', // [{dish_id, dish_name}]
    ];

    // 点菜人
    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    // 被点的人（菜品作者）
    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }
}
