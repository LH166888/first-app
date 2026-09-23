<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Fishing 捕鱼游戏
    |--------------------------------------------------------------------------
    |
    | max_score       反作弊阈值，提交分数超过此值直接判为异常并拒绝。
    | throttle_limit  单用户提交成绩的限流次数。
    | throttle_period 限流时间窗口（分钟）。
    |
    */

    'fishing' => [
        'max_score'       => env('FISHING_MAX_SCORE', 500000),
        'throttle_limit'  => env('FISHING_THROTTLE_LIMIT', 5),
        'throttle_period' => env('FISHING_THROTTLE_PERIOD', 1),
    ],

];
