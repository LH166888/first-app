<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dish;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * 提交点单（购物车提交）。
     * body: { to_user_id, dish_ids:[...], note? }
     * 校验：不能给自己点、购物车非空、所有菜品必须同属 to_user_id。
     * items 存下单时的菜品名称快照。
     * 返回 { order }。
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'to_user_id' => ['required', 'integer', 'exists:users,id'],
            'dish_ids' => ['required', 'array', 'min:1'],
            'dish_ids.*' => ['integer'],
            'note' => ['nullable', 'string', 'max:100'],
        ]);

        $me = $request->user()->id;
        $target = (int) $data['to_user_id'];

        if ($target === $me) {
            return response()->json(['message' => '不能给自己点单'], 422);
        }

        // 取出菜品并校验归属
        $dishes = Dish::whereIn('id', $data['dish_ids'])->get();

        if ($dishes->count() !== count(array_unique($data['dish_ids']))) {
            return response()->json(['message' => '部分菜品不存在'], 422);
        }
        foreach ($dishes as $dish) {
            if ($dish->user_id !== $target) {
                return response()->json(['message' => '购物车里的菜品必须来自同一个人'], 422);
            }
        }

        $items = $dishes->map(fn (Dish $d) => [
            'dish_id' => $d->id,
            'dish_name' => $d->name,
        ])->values()->all();

        $order = Order::create([
            'from_user_id' => $me,
            'to_user_id' => $target,
            'note' => $data['note'] ?? '',
            'items' => $items,
        ]);

        return response()->json(['order' => $order], 201);
    }

    /**
     * 点单详情：附带 from_user / to_user。
     * 仅点菜人或被点的人可见。
     * 返回 { order: {..., from_user, to_user} }。
     */
    public function show(Request $request, string $id)
    {
        $order = Order::with(['fromUser', 'toUser'])->find($id);

        if (! $order) {
            return response()->json(['message' => '点单记录不存在'], 404);
        }

        $me = $request->user()->id;
        if ($order->from_user_id !== $me && $order->to_user_id !== $me) {
            return response()->json(['message' => '无权查看此点单'], 403);
        }

        $data = $order->toArray();
        $data['from_user'] = ['id' => $order->fromUser->id, 'name' => $order->fromUser->name];
        $data['to_user'] = ['id' => $order->toUser->id, 'name' => $order->toUser->name];

        return response()->json(['order' => $data]);
    }

    /**
     * 我收到的点单（别人点我的菜），按时间降序。
     * 返回 { orders: [{ id, from_user, note, created_at, item_count }] }。
     */
    public function received(Request $request)
    {
        $orders = Order::with('fromUser')
            ->where('to_user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (Order $o) => [
                'id' => $o->id,
                'from_user' => ['id' => $o->fromUser->id, 'name' => $o->fromUser->name],
                'note' => $o->note,
                'created_at' => $o->created_at,
                'item_count' => count($o->items),
            ]);

        return response()->json(['orders' => $orders]);
    }

    /**
     * 我下的点单（我点别人的菜），按时间降序。
     * 返回 { orders: [{ id, to_user, note, created_at, item_count }] }。
     */
    public function placed(Request $request)
    {
        $orders = Order::with('toUser')
            ->where('from_user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (Order $o) => [
                'id' => $o->id,
                'to_user' => ['id' => $o->toUser->id, 'name' => $o->toUser->name],
                'note' => $o->note,
                'created_at' => $o->created_at,
                'item_count' => count($o->items),
            ]);

        return response()->json(['orders' => $orders]);
    }
}
