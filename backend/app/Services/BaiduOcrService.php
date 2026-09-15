<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/**
 * 百度智能云 OCR —— 身份证识别封装。
 *
 * 职责：① 取并缓存 access_token；② 调身份证识别接口；③ 解析成前端友好结构。
 * 本类不落盘、不落库、不写日志中的身份证明文，全部结果仅随单次响应返回。
 */
class BaiduOcrService
{
    private const TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';

    private const IDCARD_URL = 'https://aip.baidubce.com/rest/2.0/ocr/v1/idcard';

    private const TOKEN_CACHE_KEY = 'baidu_ocr_token';

    /** 单个图片允许的重试次数（仅用于 token 失效场景）。 */
    private const MAX_ATTEMPTS = 2;

    /**
     * 获取 access_token。缓存 29 天（百度有效期约 30 天），
     * 省掉每次识别前的一次跨境往返。
     *
     * @throws RuntimeException 取不到 token 时抛出
     */
    public function accessToken(): string
    {
        $apiKey = config('services.baidu_ocr.api_key');
        $secretKey = config('services.baidu_ocr.secret_key');

        if (empty($apiKey) || empty($secretKey)) {
            throw new RuntimeException('未配置百度 OCR 密钥（BAIDU_OCR_API_KEY / BAIDU_OCR_SECRET_KEY）');
        }

        return Cache::remember(self::TOKEN_CACHE_KEY, now()->addDays(29), function () use ($apiKey, $secretKey) {
            $resp = Http::asForm()
                ->timeout(10)
                ->post(self::TOKEN_URL, [
                    'grant_type' => 'client_credentials',
                    'client_id' => $apiKey,
                    'client_secret' => $secretKey,
                ])
                ->json();

            if (empty($resp['access_token'])) {
                // 只记百度错误码，不回显密钥
                $err = $resp['error'] ?? $resp['error_description'] ?? 'unknown';
                throw new RuntimeException("百度 access_token 获取失败[{$err}]");
            }

            return $resp['access_token'];
        });
    }

    /**
     * 身份证识别。
     *
     * @param  string  $imageBinary  原始图片二进制
     * @param  string  $side         front | back
     * @return array   百度原始返回（已确保无 error_code）
     *
     * @throws RuntimeException 百度接口报错或网络异常时抛出
     */
    public function recognizeIdCard(string $imageBinary, string $side = 'front'): array
    {
        for ($attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++) {
            try {
                $token = $this->accessToken();

                $resp = Http::asForm()
                    ->timeout(20) // 跨境调用，超时给足，见技术方案第八节
                    ->post(self::IDCARD_URL.'?access_token='.$token, [
                        'image' => base64_encode($imageBinary),
                        'id_card_side' => $side,
                        'detect_card' => 'true',    // 关键：返回摆正裁剪整图 card_image
                        'detect_photo' => 'true',   // 返回头像切图 photo
                        'detect_direction' => 'true',
                        'detect_risk' => 'true',
                        'detect_quality' => 'true',
                    ])
                    ->json();
            } catch (Throwable $e) {
                throw new RuntimeException('调用百度 OCR 失败：'.$e->getMessage(), previous: $e);
            }

            // token 失效（110/111）：清缓存后重试一次
            if (in_array($resp['error_code'] ?? null, [110, 111], true) && $attempt < self::MAX_ATTEMPTS) {
                Cache::forget(self::TOKEN_CACHE_KEY);
                continue;
            }

            if (isset($resp['error_code'])) {
                // 含额度用尽(17)/QPS 超限(18)等，统一抛出，由 Controller 归一为 5001
                throw new RuntimeException("百度接口错误[{$resp['error_code']}]: ".($resp['error_msg'] ?? ''));
            }

            return $resp;
        }

        throw new RuntimeException('百度接口错误：token 失效且重试后仍未成功');
    }

    /**
     * 把百度返回整理成前端契约结构。
     */
    public function normalize(array $resp): array
    {
        $words = $resp['words_result'] ?? [];
        $get = fn (string $key) => $words[$key]['words'] ?? '';

        $idno = $get('公民身份号码');

        return [
            'image_status' => $resp['image_status'] ?? 'unknown',
            'fields' => [
                // 正面
                'name' => $get('姓名'),
                'sex' => $get('性别'),
                'nation' => $get('民族'),
                'birth' => $get('出生'),
                'address' => $get('住址'),
                'idno' => $idno,
                'idno_valid' => $idno ? $this->validateIdNo($idno) : false,
                // 背面（side=back 时有值）
                'authority' => $get('签发机关'),
                'issue_date' => $get('签发日期'),
                'valid_date' => $get('失效日期'),
            ],
            // 摆正裁剪整图 / 头像切图（base64 无编码头）→ 拼成 data URI 方便前端直接用
            'card_image' => ! empty($resp['card_image'])
                ? 'data:image/jpeg;base64,'.$resp['card_image'] : null,
            'photo' => ! empty($resp['photo'])
                ? 'data:image/jpeg;base64,'.$resp['photo'] : null,
            'risk' => [
                'risk_type' => $resp['risk_type'] ?? null,
                'card_quality' => $resp['card_quality'] ?? null,
            ],
        ];
    }

    /**
     * 身份证号本地校验（GB 11643 校验位）。
     */
    public function validateIdNo(string $id): bool
    {
        if (! preg_match('/^\d{17}[\dXx]$/', $id)) {
            return false;
        }

        $weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
        $codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

        $sum = 0;
        for ($i = 0; $i < 17; $i++) {
            $sum += (int) $id[$i] * $weights[$i];
        }

        return strtoupper($id[17]) === $codes[$sum % 11];
    }
}
