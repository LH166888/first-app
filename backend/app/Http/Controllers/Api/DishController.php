<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dish;
use App\Models\User;
use Illuminate\Http\Request;

class DishController extends Controller
{
    /**
     * 我的菜品列表（当前登录用户创建的）。
     * 返回 { dishes: [...] }，与前端 mockData.getMyDishes 一致。
     */
    public function index(Request $request)
    {
        $dishes = $request->user()->dishes()->latest()->get();

        return response()->json(['dishes' => $dishes]);
    }

    /**
     * 菜品详情：附带作者信息 user、是否本人 is_owner。
     * 返回 { dish: {..., user, is_owner} }。
     */
    public function show(Request $request, string $id)
    {
        $dish = Dish::with('user')->find($id);

        if (! $dish) {
            return response()->json(['message' => '菜品不存在'], 404);
        }

        $data = $dish->toArray();
        $data['is_owner'] = $dish->user_id === $request->user()->id;

        return response()->json(['dish' => $data]);
    }

    /**
     * 创建菜品。body: { name, image_key?, ingredients:[{name,amount}], steps:[{description}] }
     * step_number 由后端按顺序生成，保证与前端展示一致。
     */
    public function store(Request $request)
    {
        $data = $this->validateDish($request);

        $dish = $request->user()->dishes()->create([
            'name' => $data['name'],
            'image_key' => $data['image_key'] ?? null,
            'ingredients' => $this->normalizeIngredients($data['ingredients']),
            'steps' => $this->normalizeSteps($data['steps']),
        ]);

        return response()->json(['dish' => $dish], 201);
    }

    /**
     * 更新菜品（仅属主）。
     */
    public function update(Request $request, string $id)
    {
        $dish = Dish::find($id);

        if (! $dish) {
            return response()->json(['message' => '菜品不存在'], 404);
        }
        if ($dish->user_id !== $request->user()->id) {
            return response()->json(['message' => '无权编辑此菜品'], 403);
        }

        $data = $this->validateDish($request);

        $dish->update([
            'name' => $data['name'],
            'image_key' => $data['image_key'] ?? null,
            'ingredients' => $this->normalizeIngredients($data['ingredients']),
            'steps' => $this->normalizeSteps($data['steps']),
        ]);

        return response()->json(['dish' => $dish]);
    }

    /**
     * 删除菜品（仅属主）。
     */
    public function destroy(Request $request, string $id)
    {
        $dish = Dish::find($id);

        if (! $dish) {
            return response()->json(['message' => '菜品不存在'], 404);
        }
        if ($dish->user_id !== $request->user()->id) {
            return response()->json(['message' => '无权删除此菜品'], 403);
        }

        $dish->delete();

        return response()->json(['message' => '已删除']);
    }

    /**
     * 发现页：列出除自己外、有菜品的用户及其菜品数量与最新时间，按最新降序。
     * 返回 { chefs: [{ user:{id,name}, dish_count, latest_at }] }。
     */
    public function chefs(Request $request)
    {
        $me = $request->user()->id;

        $chefs = User::where('id', '!=', $me)
            ->withCount('dishes')
            ->having('dishes_count', '>', 0)
            ->with(['dishes' => fn ($q) => $q->latest()->limit(1)])
            ->get()
            ->map(function (User $user) {
                return [
                    'user' => ['id' => $user->id, 'name' => $user->name],
                    'dish_count' => $user->dishes_count,
                    'latest_at' => optional($user->dishes->first())->created_at,
                ];
            })
            ->sortByDesc('latest_at')
            ->values();

        return response()->json(['chefs' => $chefs]);
    }

    /**
     * 某个用户的全部菜品（发现页点进某人后）。
     * 返回 { user:{id,name}, dishes:[...], is_self }。
     */
    public function userDishes(Request $request, string $userId)
    {
        $user = User::find($userId);

        if (! $user) {
            return response()->json(['message' => '用户不存在'], 404);
        }

        $dishes = $user->dishes()->latest()->get();

        return response()->json([
            'user' => ['id' => $user->id, 'name' => $user->name],
            'dishes' => $dishes,
            'is_self' => $user->id === $request->user()->id,
        ]);
    }

    // ---- 私有工具 ----

    private function validateDish(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'image_key' => ['nullable', 'string', 'max:255'],
            'ingredients' => ['required', 'array', 'min:1'],
            'ingredients.*.name' => ['required', 'string', 'max:50'],
            'ingredients.*.amount' => ['nullable', 'string', 'max:50'],
            'steps' => ['required', 'array', 'min:1'],
            'steps.*.description' => ['required', 'string', 'max:500'],
        ]);
    }

    private function normalizeIngredients(array $ingredients): array
    {
        return array_map(fn ($ing) => [
            'name' => $ing['name'],
            'amount' => $ing['amount'] ?? '',
        ], $ingredients);
    }

    private function normalizeSteps(array $steps): array
    {
        $result = [];
        foreach (array_values($steps) as $i => $step) {
            $result[] = [
                'step_number' => $i + 1,
                'description' => $step['description'],
            ];
        }

        return $result;
    }
}
