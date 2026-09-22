<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginTokenLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_revokes_previous_web_tokens(): void
    {
        $user = User::create([
            'name' => '测试',
            'account' => 'tester1',
            'password' => Hash::make('secret123'),
        ]);

        // 预先造两个历史 web token
        $user->createToken('web');
        $user->createToken('web');
        $this->assertSame(2, $user->tokens()->count());

        $res = $this->postJson('/api/login', [
            'account' => 'tester1',
            'password' => 'secret123',
        ]);

        $res->assertOk()->assertJsonStructure(['user', 'token']);
        // 登录后只应剩下本次新建的 1 个 token
        $this->assertSame(1, $user->fresh()->tokens()->count());
    }
}
