<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * 微信公众号（测试号/服务号通用）—— 模板消息推送封装。
 *
 * 职责：① 取并缓存 access_token；② 调模板消息接口推送给指定 openid。
 * 用的是官方公众平台"接口测试号"，appID/secret/template_id 换成正式服务号的也一样能用。
 */
class WechatTemplateService
{
    private const TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';

    private const SEND_URL = 'https://api.weixin.qq.com/cgi-bin/message/template/send';

    private const TOKEN_CACHE_KEY = 'wechat_mp_access_token';

    /**
     * 获取 access_token。缓存 100 分钟（微信有效期 120 分钟），留余量避免边界失效。
     *
     * @throws RuntimeException 取不到 token 时抛出
     */
    public function accessToken(): string
    {
        $appId = config('services.wechat_mp.app_id');
        $appSecret = config('services.wechat_mp.app_secret');

        if (empty($appId) || empty($appSecret)) {
            throw new RuntimeException('未配置微信公众号密钥（WECHAT_MP_APP_ID / WECHAT_MP_APP_SECRET）');
        }

        return Cache::remember(self::TOKEN_CACHE_KEY, now()->addMinutes(100), function () use ($appId, $appSecret) {
            $resp = Http::timeout(10)
                ->get(self::TOKEN_URL, [
                    'grant_type' => 'client_credential',
                    'appid' => $appId,
                    'secret' => $appSecret,
                ])
                ->json();

            if (empty($resp['access_token'])) {
                $err = $resp['errcode'] ?? 'unknown';
                $msg = $resp['errmsg'] ?? 'unknown';
                throw new RuntimeException("微信 access_token 获取失败[{$err}]: {$msg}");
            }

            return $resp['access_token'];
        });
    }

    /**
     * 发送模板消息。
     *
     * @param  string  $openid    接收者 openid（测试号"用户列表"里能看到）
     * @param  string  $templateId  模板 ID（测试号"模板消息接口"里新建后拿到）
     * @param  array<string, string>  $data  模板变量，如 ['content' => '订单已发货', 'time' => '2026-09-20 15:30']
     * @param  string|null  $url  点击模板消息跳转的链接，不传则不可跳转
     *
     * @throws RuntimeException 微信接口报错或网络异常时抛出
     */
    public function send(string $openid, string $templateId, array $data, ?string $url = null): void
    {
        $token = $this->accessToken();

        $payload = [
            'touser' => $openid,
            'template_id' => $templateId,
            'data' => array_map(fn ($value) => ['value' => (string) $value], $data),
        ];

        if ($url) {
            $payload['url'] = $url;
        }

        $resp = Http::timeout(10)
            ->post(self::SEND_URL.'?access_token='.$token, $payload)
            ->json();

        // 42001/40001：token 过期或无效，清缓存后由下一次调用重新获取，本次直接报错
        if (in_array($resp['errcode'] ?? null, [42001, 40001], true)) {
            Cache::forget(self::TOKEN_CACHE_KEY);
        }

        if (($resp['errcode'] ?? 0) !== 0) {
            throw new RuntimeException('微信模板消息发送失败['.($resp['errcode'] ?? '?').']: '.($resp['errmsg'] ?? ''));
        }
    }
}
