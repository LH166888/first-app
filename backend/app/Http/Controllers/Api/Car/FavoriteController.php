<?php

namespace App\Http\Controllers\Api\Car;

use App\Http\Controllers\Controller;
use App\Http\Requests\Car\StoreFavoriteRequest;
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

        [$page, $perPage] = $this->getPaginationParams($request);
        $paginator = Car::whereIn('id', $carIds)
            ->orderByDesc('sales')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * 添加收藏。body: { car_id }
     * 依赖 (user_id, car_id) 联合唯一索引 + firstOrCreate 防重复。
     */
    public function store(StoreFavoriteRequest $request)
    {
        $data = $request->validated();

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
