<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\WechatTemplateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    /**
     * 账号格式规则：字母/数字/@/.，长度 3-18，无空格无其他特殊字符、无中文。
     */
    private const ACCOUNT_RULE = ['required', 'string', 'regex:/^[A-Za-z0-9@.]{3,18}$/'];

    /** 邀请码缓存 key 前缀（按账号隔离），值为 6 位码，有效期 60 秒 */
    private const CODE_CACHE_PREFIX = 'invite_code:';

    /** 发码冷却 key 前缀（按账号隔离），同账号 60 秒只能发一次 */
    private const CODE_COOLDOWN_PREFIX = 'invite_cd:';

    /**
     * 获取注册邀请码：生成 6 位码推送到管理员微信，缓存 60 秒。
     * 码不返回前端——须由管理员在微信收到后转告注册者。
     */
    public function sendInviteCode(Request $request, WechatTemplateService $wechat)
    {
        $data = $request->validate([
            'account' => self::ACCOUNT_RULE,
        ]);

        $account = $data['account'];
        $cooldownKey = self::CODE_COOLDOWN_PREFIX.$account;

        // Cache::add 原子占位：已存在说明 60 秒内已发过，拒绝重复发送
        if (! Cache::add($cooldownKey, 1, now()->addSeconds(60))) {
            throw ValidationException::withMessages([
                'account' => ['请求过于频繁，请 60 秒后再试'],
            ]);
        }

        $openid = config('services.wechat_mp.default_openid');
        $templateId = config('services.wechat_mp.template_id');

        if (empty($openid) || empty($templateId)) {
            Cache::forget($cooldownKey);
            throw ValidationException::withMessages([
                'account' => ['服务端未配置微信推送，请联系管理员'],
            ]);
        }

        $code = (string) random_int(100000, 999999);
        Cache::put(self::CODE_CACHE_PREFIX.$account, $code, now()->addSeconds(60));

        try {
            // 模板变量名为 data（模板内容：邀请码：{{data.DATA}}）
            $wechat->send($openid, $templateId, ['data' => $code]);
        } catch (Throwable $e) {
            // 推送失败：清掉码与冷却锁，让用户可立即重试
            Cache::forget(self::CODE_CACHE_PREFIX.$account);
            Cache::forget($cooldownKey);

            return response()->json(['message' => '邀请码发送失败，请稍后重试'], 502);
        }

        return response()->json(['message' => '邀请码已发送，请联系管理员获取']);
    }

    /**
     * 注册：校验邀请码后创建用户并返回 Sanctum token。
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'account' => [...self::ACCOUNT_RULE, 'unique:users,account'],
            'password' => ['required', 'string', 'min:6'],
            'invite_code' => ['required', 'string'],
        ]);

        $account = $data['account'];
        $cached = Cache::get(self::CODE_CACHE_PREFIX.$account);

        if (! $cached || ! hash_equals($cached, $data['invite_code'])) {
            throw ValidationException::withMessages([
                'invite_code' => ['邀请码错误或已过期'],
            ]);
        }

        // 一次性使用：校验通过即作废，避免同码重复注册
        Cache::forget(self::CODE_CACHE_PREFIX.$account);
        Cache::forget(self::CODE_COOLDOWN_PREFIX.$account);

        $user = User::create([
            'name' => $data['name'],
            'account' => $account,
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('web')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * 登录：校验账号密码，返回 Sanctum token。
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'account' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('account', $data['account'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'account' => ['账号或密码不正确'],
            ]);
        }

        // 吊销该用户历史 'web' token，避免 personal_access_tokens 无限增长
        $user->tokens()->where('name', 'web')->delete();

        $token = $user->createToken('web')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * 修改昵称（需登录）。
     */
    public function updateName(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $user->name = $data['name'];
        $user->save();

        return response()->json(['user' => $user]);
    }

    /**
     * 修改密码（需登录）：校验旧密码后更新，并吊销全部 token，强制重新登录。
     */
    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['当前密码不正确'],
            ]);
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        // 吊销该用户的全部 token（含当前），前端据此强制重新登录
        $user->tokens()->delete();

        return response()->json(['message' => '密码已修改，请重新登录']);
    }

    /**
     * 登出：删除当前请求所用的 token。
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => '已退出登录']);
    }
}
