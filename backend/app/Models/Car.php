<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Car extends Model
{
    // 主键是前端 slug 字符串（如 byd-song-plus），不是自增整数
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'brand', 'energy', 'level',
        'price_min', 'price_max', 'sales', 'year', 'trend', 'config',
    ];

    protected $casts = [
        'price_min' => 'decimal:2',
        'price_max' => 'decimal:2',
        'sales' => 'integer',
        'year' => 'integer',
        'trend' => 'array',   // 12 个月销量
        'config' => 'array',  // 配置参数，字段因车型而异
    ];

    // 序列化时把 price_min/price_max 合成 price:[min,max]，贴合前端 cars.js 的数据形状
    protected $appends = ['price'];

    // 输出用 price 数组，隐藏拆分后的两个原始列，减少前端改动
    protected $hidden = ['price_min', 'price_max'];

    public function getPriceAttribute(): array
    {
        return [(float) $this->price_min, (float) $this->price_max];
    }
}
