<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\Request;

class CarController extends Controller
{
    /**
     * 车型列表。默认按销量降序返回全部，支持可选筛选：
     *   ?energy=ev|phev|fuel  ?level=轿车|SUV|MPV  ?brand=比亚迪  ?keyword=宋
     * 与前端 cars.js 的筛选维度对应。
     */
    public function index(Request $request)
    {
        $query = Car::query();

        if ($energy = $request->query('energy')) {
            $query->where('energy', $energy);
        }
        if ($level = $request->query('level')) {
            $query->where('level', $level);
        }
        if ($brand = $request->query('brand')) {
            $query->where('brand', $brand);
        }
        if ($keyword = $request->query('keyword')) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->orWhere('brand', 'like', "%{$keyword}%");
            });
        }

        $cars = $query->orderByDesc('sales')->get();

        return response()->json([
            'data' => $cars,
            'total' => $cars->count(),
        ]);
    }

    /**
     * 车型详情。
     */
    public function show(string $id)
    {
        $car = Car::find($id);

        if (! $car) {
            return response()->json(['message' => '车型不存在'], 404);
        }

        return response()->json(['data' => $car]);
    }
}
