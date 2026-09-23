<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Car\CarController;
use App\Http\Controllers\Api\Car\FavoriteController;
use App\Http\Controllers\Api\Games\FishingController;
use App\Http\Controllers\Api\Menu\DishController;
use App\Http\Controllers\Api\Menu\OrderController;
use App\Http\Controllers\Api\Menu\UploadController;
use App\Http\Controllers\Api\Tools\IdCardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ---- 公开接口（无需登录）----
// 车型列表 / 详情
Route::get('/cars', [CarController::class, 'index']);
Route::get('/cars/{id}', [CarController::class, 'show']);

// 注册 / 登录（挂 throttle 限流，防暴力破解与刷码）
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
// 获取注册邀请码（推送到管理员微信）
Route::post('/invite-code', [AuthController::class, 'sendInviteCode'])->middleware('throttle:5,1');

// ---- 需登录接口（Sanctum token）----
Route::middleware('auth:sanctum')->group(function () {
    // 当前登录用户
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // 登出
    Route::post('/logout', [AuthController::class, 'logout']);

    // 个人信息：修改昵称 / 修改密码
    Route::patch('/user/name', [AuthController::class, 'updateName']);
    Route::patch('/user/password', [AuthController::class, 'updatePassword']);

    // 收藏：列表 / 添加 / 取消
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{carId}', [FavoriteController::class, 'destroy']);

    // 工具：身份证识别（图片与文字均不落盘、不落库）
    Route::post('/tools/idcard/recognize', [IdCardController::class, 'recognize']);

    // ---- 菜单模块：菜品 ----
    // 注意：静态/具体路径（chefs、users/{id}/dishes）放在 dishes/{id} 之前，避免被通配捕获。
    Route::get('/dishes', [DishController::class, 'index']);
    Route::post('/dishes', [DishController::class, 'store']);
    Route::get('/chefs', [DishController::class, 'chefs']);
    Route::get('/users/{userId}/dishes', [DishController::class, 'userDishes']);
    Route::get('/dishes/{id}', [DishController::class, 'show']);
    Route::put('/dishes/{id}', [DishController::class, 'update']);
    Route::delete('/dishes/{id}', [DishController::class, 'destroy']);

    // ---- 菜单模块：点单 ----
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/received', [OrderController::class, 'received']);
    Route::get('/orders/placed', [OrderController::class, 'placed']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    // ---- 菜单模块：图片上传（R2 预签名直传）----
    Route::post('/menu/upload-url', [UploadController::class, 'presign']);

    // ---- Fishing 捕鱼游戏：成绩 / 排行榜 / 个人数据 ----
    // 提交成绩挂 throttle 限流（按登录用户计数），防止刷分；次数/窗口读 config/games.php。
    Route::post('/games/fishing/scores', [FishingController::class, 'store'])
        ->middleware('throttle:'.config('games.fishing.throttle_limit').','.config('games.fishing.throttle_period'));
    Route::get('/games/fishing/leaderboard', [FishingController::class, 'leaderboard']);
    Route::get('/games/fishing/me', [FishingController::class, 'myStats']);
});
