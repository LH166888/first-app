<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 点单表：一次点单 = 某人(from)给某人(to)点了多个菜品 + 备注。
     * items 用 JSON 列存菜品快照 [{dish_id, dish_name}]，即使原菜品后续被改名/删除，
     * 点单记录仍保留下单时的名称。
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_user_id')->constrained('users')->cascadeOnDelete(); // 点菜人
            $table->foreignId('to_user_id')->constrained('users')->cascadeOnDelete();   // 被点的人（菜品作者）
            $table->string('note')->nullable();
            $table->json('items'); // [{dish_id, dish_name}]
            $table->timestamps();

            $table->index('to_user_id');
            $table->index('from_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
