<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cars', function (Blueprint $table) {
            // 主键用前端 slug 字符串（如 byd-song-plus），前端路由/收藏/对比均依赖这个 id
            $table->string('id')->primary();
            $table->string('name');
            $table->string('brand');
            $table->string('energy'); // ev=纯电, phev=插混, fuel=燃油
            $table->string('level'); // 轿车 / SUV / MPV
            $table->decimal('price_min', 8, 2); // 官方指导价区间（万元）
            $table->decimal('price_max', 8, 2);
            $table->unsignedInteger('sales'); // 年度销量（辆）
            $table->unsignedSmallInteger('year'); // 统计年度，如 2023
            $table->json('trend'); // 12 个月销量走势
            $table->json('config'); // 配置参数，字段因车型而异
            $table->timestamps();

            $table->index('brand');
            $table->index('energy');
            $table->index('level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
