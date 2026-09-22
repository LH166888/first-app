<?php

namespace App\Console\Commands;

use App\Services\WechatTemplateService;
use Illuminate\Console\Command;
use Throwable;

/**
 * 微信模板消息推送 —— 本地手动测试用。
 *
 * 用法：
 *   php artisan wechat:test-send
 *   php artisan wechat:test-send --openid=真实openid --content="自定义内容"
 *
 * 默认 openid 取 config('services.wechat_mp.default_openid')（即 .env 里的 WECHAT_MP_DEFAULT_OPENID）。
 */
class WechatTestSend extends Command
{
    protected $signature = 'wechat:test-send
        {--openid= : 接收者 openid，不传则用 .env 里的 WECHAT_MP_DEFAULT_OPENID}';

    protected $description = '给指定 openid 发一条微信模板消息，用于验证公众号推送是否配置正确';

    public function handle(WechatTemplateService $wechat): int
    {
        $openid = $this->option('openid') ?: config('services.wechat_mp.default_openid');
        $templateId = config('services.wechat_mp.template_id');

        if (empty($openid)) {
            $this->error('缺少 openid：传 --openid=xxx，或在 .env 配置 WECHAT_MP_DEFAULT_OPENID');

            return self::FAILURE;
        }

        if (empty($templateId)) {
            $this->error('缺少模板 ID：请在 .env 配置 WECHAT_MP_TEMPLATE_ID');

            return self::FAILURE;
        }

        // 随机 6 位纯数字邀请码：范围 100000-999999，保证首位不为 0、恒为 6 位
        $code = (string) random_int(100000, 999999);

        $this->info("即将推送到 openid: {$openid}，邀请码：{$code}");

        try {
            // 模板变量名为 data（模板内容：邀请码：{{data.DATA}}）
            $wechat->send($openid, $templateId, [
                'data' => $code,
            ]);
        } catch (Throwable $e) {
            $this->error('推送失败：'.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('推送成功，去微信公众号消息里看一下。');

        return self::SUCCESS;
    }
}
