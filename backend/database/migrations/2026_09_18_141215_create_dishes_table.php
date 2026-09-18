<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 菜品表：一道菜属于一个用户，配料/步骤用 JSON 列存快照
     * （与 cars 表的 trend/config JSON 列风格一致）。
     */
    public function up(): void
    {
        Schema::create('dishes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('image_key')->nullable(); // R2 对象 key，前端拼 public 域名成完整 URL
            $table->json('ingredients'); // [{name, amount}]
            $table->json('steps');       // [{step_number, description}]
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dishes');
    }
};
