<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    /**
     * 我的收藏。返回收藏的车型完整信息（贴合前端展示需求），
     * 前端若只要 id 列表，可自行取 data[].id。
     */
    public function index(Request $request)
    {
        $carIds = $request->user()->favorites()->pluck('car_id');

        $cars = Car::whereIn('id', $carIds)->orderByDesc('sales')->get();

        return response()->json([
            'data' => $cars,
            'ids' => $carIds,
        ]);
    }

    /**
     * 添加收藏。body: { car_id }
     * 依赖 (user_id, car_id) 联合唯一索引 + firstOrCreate 防重复。
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'car_id' => ['required', 'string', 'exists:cars,id'],
        ]);

        $request->user()->favorites()->firstOrCreate([
            'car_id' => $data['car_id'],
        ]);

        return response()->json(['message' => '已收藏', 'car_id' => $data['car_id']], 201);
    }

    /**
     * 取消收藏。
     */
    public function destroy(Request $request, string $carId)
    {
        $request->user()->favorites()->where('car_id', $carId)->delete();

        return response()->json(['message' => '已取消收藏', 'car_id' => $carId]);
    }
}
