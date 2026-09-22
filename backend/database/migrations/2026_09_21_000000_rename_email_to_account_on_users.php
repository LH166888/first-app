<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 废弃"邮箱"概念，改为"账号"：将 users.email 列重命名为 account。
 *
 * 说明：Laravel 12 原生支持 renameColumn（底层已内置 doctrine 能力）。
 * unique 索引会随列一起保留，无需重建。email_verified_at 属遗留字段，保持不动。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('email', 'account');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('account', 'email');
        });
    }
};
