<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CarController;
use App\Http\Controllers\Api\FavoriteController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ---- 公开接口（无需登录）----
// 车型列表 / 详情
Route::get('/cars', [CarController::class, 'index']);
Route::get('/cars/{id}', [CarController::class, 'show']);

// 注册 / 登录
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ---- 需登录接口（Sanctum token）----
Route::middleware('auth:sanctum')->group(function () {
    // 当前登录用户
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // 登出
    Route::post('/logout', [AuthController::class, 'logout']);

    // 收藏：列表 / 添加 / 取消
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{carId}', [FavoriteController::class, 'destroy']);
});
