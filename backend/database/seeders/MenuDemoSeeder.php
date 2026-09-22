<?php

namespace Database\Seeders;

use App\Models\Dish;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * 菜单模块联调用假数据：3 个测试厨师 + 5 道菜 + 3 条点单，
 * 与前端 mockData.js 内容一致。仅供本地/联调，通过
 *   php artisan db:seed --class=MenuDemoSeeder
 * 单独运行，不进 DatabaseSeeder（生产不灌）。可重复运行。
 *
 * 测试账号（密码均为 password）：
 *   zhangsan@demo.test / lisi@demo.test / wangwu@demo.test
 */
class MenuDemoSeeder extends Seeder
{
    public function run(): void
    {
        // 1) 三个测试厨师（按 email 幂等）
        $zhangsan = $this->ensureUser('张三', 'zhangsan@demo.test');
        $lisi = $this->ensureUser('李四', 'lisi@demo.test');
        $wangwu = $this->ensureUser('王五', 'wangwu@demo.test');

        $userIds = [$zhangsan->id, $lisi->id, $wangwu->id];

        // 2) 清掉这三人相关的旧 demo 数据，保证可重复运行
        Order::whereIn('from_user_id', $userIds)
            ->orWhereIn('to_user_id', $userIds)
            ->delete();
        Dish::whereIn('user_id', $userIds)->delete();

        // 3) 重建菜品
        $tangcu = $this->makeDish($zhangsan, '糖醋里脊', [
            ['name' => '猪里脊', 'amount' => '300g'],
            ['name' => '番茄酱', 'amount' => '3勺'],
            ['name' => '白糖', 'amount' => '2勺'],
            ['name' => '醋', 'amount' => '1勺'],
        ], [
            '里脊切块，用料酒和盐腌制15分钟。',
            '裹淀粉后下油锅炸至金黄捞出。',
            '调糖醋汁（番茄酱+糖+醋+水），烧开后倒入炸好的肉块翻炒均匀。',
        ]);

        $gongbao = $this->makeDish($lisi, '宫保鸡丁', [
            ['name' => '鸡胸肉', 'amount' => '250g'],
            ['name' => '花生米', 'amount' => '50g'],
            ['name' => '干辣椒', 'amount' => '10个'],
        ], [
            '鸡肉切丁腌制。',
            '热油爆香干辣椒，下鸡丁炒熟，加花生米翻炒。',
        ]);

        $fanqie = $this->makeDish($zhangsan, '番茄炒蛋', [
            ['name' => '鸡蛋', 'amount' => '3个'],
            ['name' => '番茄', 'amount' => '2个'],
        ], [
            '鸡蛋打散炒熟盛出。',
            '番茄切块炒出汁，倒入鸡蛋翻炒均匀。',
        ]);

        $mapo = $this->makeDish($lisi, '麻婆豆腐', [
            ['name' => '嫩豆腐', 'amount' => '1盒'],
            ['name' => '牛肉末', 'amount' => '80g'],
            ['name' => '豆瓣酱', 'amount' => '2勺'],
        ], [
            '豆腐切块焯水。',
            '炒香豆瓣酱和肉末，加水烧开下豆腐，勾芡。',
        ]);

        $this->makeDish($wangwu, '可乐鸡翅', [
            ['name' => '鸡翅中', 'amount' => '10个'],
            ['name' => '可乐', 'amount' => '1罐'],
        ], [
            '鸡翅两面煎金黄。',
            '倒入可乐没过鸡翅，中小火收汁。',
        ]);

        // 4) 重建点单
        Order::create([
            'from_user_id' => $lisi->id,
            'to_user_id' => $zhangsan->id,
            'note' => '糖醋汁多放点糖，谢谢！',
            'items' => [
                ['dish_id' => $tangcu->id, 'dish_name' => $tangcu->name],
                ['dish_id' => $fanqie->id, 'dish_name' => $fanqie->name],
            ],
        ]);
        Order::create([
            'from_user_id' => $wangwu->id,
            'to_user_id' => $zhangsan->id,
            'note' => '',
            'items' => [
                ['dish_id' => $tangcu->id, 'dish_name' => $tangcu->name],
            ],
        ]);
        Order::create([
            'from_user_id' => $zhangsan->id,
            'to_user_id' => $lisi->id,
            'note' => '少放辣',
            'items' => [
                ['dish_id' => $gongbao->id, 'dish_name' => $gongbao->name],
                ['dish_id' => $mapo->id, 'dish_name' => $mapo->name],
            ],
        ]);

        $this->command->info('菜单 demo 数据已就绪：张三/李四/王五（密码 password），5 道菜 + 3 条点单。');
    }

    private function ensureUser(string $name, string $account): User
    {
        return User::firstOrCreate(
            ['account' => $account],
            ['name' => $name, 'password' => Hash::make('password')],
        );
    }

    private function makeDish(User $user, string $name, array $ingredients, array $stepDescriptions): Dish
    {
        $steps = [];
        foreach (array_values($stepDescriptions) as $i => $desc) {
            $steps[] = ['step_number' => $i + 1, 'description' => $desc];
        }

        return $user->dishes()->create([
            'name' => $name,
            'image_key' => null,
            'ingredients' => $ingredients,
            'steps' => $steps,
        ]);
    }
}
