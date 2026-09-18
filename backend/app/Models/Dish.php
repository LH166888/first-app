<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dish extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'image_key',
        'ingredients',
        'steps',
    ];

    protected $casts = [
        'ingredients' => 'array', // [{name, amount}]
        'steps' => 'array',       // [{step_number, description}]
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
