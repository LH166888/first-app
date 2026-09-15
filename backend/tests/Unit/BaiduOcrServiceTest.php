<?php

namespace Tests\Unit;

use App\Services\BaiduOcrService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

class BaiduOcrServiceTest extends TestCase
{
    private BaiduOcrService $ocr;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.baidu_ocr.api_key', 'test-ak');
        config()->set('services.baidu_ocr.secret_key', 'test-sk');

        $this->ocr = new BaiduOcrService;
    }

    /** 未配置密钥时应直接抛出，而不是发请求。 */
    public function test_missing_credentials_throws(): void
    {
        config()->set('services.baidu_ocr.api_key', '');

        Http::fake();

        $this->expectException(RuntimeException::class);

        $this->ocr->accessToken();
    }

    /** access_token 应被缓存，第二次不再请求百度。 */
    public function test_access_token_is_cached(): void
    {
        Http::fake([
            '*oauth*' => Http::response(['access_token' => 'tok-1', 'expires_in' => 2592000]),
        ]);

        $first = $this->ocr->accessToken();
        $second = $this->ocr->accessToken();

        $this->assertSame('tok-1', $first);
        $this->assertSame('tok-1', $second);
        Http::assertSentCount(1);
    }

    /** 正常识别：应回报文，且请求带上 detect_card 等开关。 */
    public function test_recognize_success_passes_detect_flags(): void
    {
        Http::fake([
            '*oauth*' => Http::response(['access_token' => 'tok-1']),
            '*idcard*' => Http::response([
                'words_result' => ['姓名' => ['words' => '张三']],
                'image_status' => 'normal',
            ]),
        ]);

        $resp = $this->ocr->recognizeIdCard('binary-data', 'front');

        $this->assertSame('normal', $resp['image_status']);

        Http::assertSent(function ($request) {
            // 只校验发往 idcard 的那次请求（token 请求不带这些开关）
            if (! str_contains($request->url(), 'idcard')) {
                return false;
            }

            $data = $request->data();

            return $data['detect_card'] === 'true'
                && $data['detect_direction'] === 'true'
                && $data['detect_photo'] === 'true'
                && $data['detect_risk'] === 'true'
                && $data['detect_quality'] === 'true'
                && $data['id_card_side'] === 'front'
                && $data['image'] === base64_encode('binary-data');
        });
    }

    /** token 失效（110）：清缓存后自动重试一次，最终成功。 */
    public function test_token_invalid_retries_once(): void
    {
        Http::fake([
            '*oauth*' => Http::response(['access_token' => 'tok-1']),
            '*idcard*' => Http::sequence()
                ->push(['error_code' => 110, 'error_msg' => 'token expired'], 200)
                ->push(['words_result' => [], 'image_status' => 'normal'], 200),
        ]);

        $resp = $this->ocr->recognizeIdCard('binary-data');

        $this->assertSame('normal', $resp['image_status']);

        // 旧 token 被清除 → 重试时重新取了一次 token（共 2 次 oauth + 2 次 idcard）
        Http::assertSentCount(4);
        $this->assertSame('tok-1', Cache::get('baidu_ocr_token'));
    }

    /** 额度用尽（17）等业务错误应抛出，交由 Controller 归一为 5001。 */
    public function test_business_error_code_throws(): void
    {
        Http::fake([
            '*oauth*' => Http::response(['access_token' => 'tok-1']),
            '*idcard*' => Http::response(['error_code' => 17, 'error_msg' => 'daily limit reached']),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/17/');

        $this->ocr->recognizeIdCard('binary-data');
    }

    /** 网络异常应包装成 RuntimeException，不把底层异常直接抛给上层。 */
    public function test_network_failure_wrapped(): void
    {
        Http::fake([
            '*oauth*' => Http::response(['access_token' => 'tok-1']),
            '*idcard*' => fn () => throw new \Illuminate\Http\Client\ConnectionException('timed out'),
        ]);

        $this->expectException(RuntimeException::class);

        $this->ocr->recognizeIdCard('binary-data');
    }

    /** normalize：字段映射 + card_image 拼 data URI + 风险块。 */
    public function test_normalize_maps_fields_and_images(): void
    {
        $result = $this->ocr->normalize([
            'image_status' => 'normal',
            'words_result' => [
                '姓名' => ['words' => '张三'],
                '性别' => ['words' => '男'],
                '民族' => ['words' => '汉'],
                '出生' => ['words' => '19900101'],
                '住址' => ['words' => '北京市朝阳区某路 1 号'],
                '公民身份号码' => ['words' => '110101199001011237'],
                '签发机关' => ['words' => '北京市公安局'],
                '失效日期' => ['words' => '2030.01.01'],
            ],
            'card_image' => 'AAAA',
            'photo' => 'BBBB',
            'risk_type' => 'normal',
            'card_quality' => ['blur' => 0],
        ]);

        $this->assertSame('张三', $result['fields']['name']);
        $this->assertSame('男', $result['fields']['sex']);
        $this->assertSame('19900101', $result['fields']['birth']);
        $this->assertSame('110101199001011237', $result['fields']['idno']);
        $this->assertTrue($result['fields']['idno_valid']); // 校验位已算过，合法
        $this->assertSame('北京市公安局', $result['fields']['authority']);
        $this->assertSame('data:image/jpeg;base64,AAAA', $result['card_image']);
        $this->assertSame('data:image/jpeg;base64,BBBB', $result['photo']);
        $this->assertSame('normal', $result['risk']['risk_type']);
    }

    /** normalize：百度没回 card_image 时应为 null，而不是拼出残缺 URI。 */
    public function test_normalize_without_images_gives_null(): void
    {
        $result = $this->ocr->normalize(['words_result' => []]);

        $this->assertNull($result['card_image']);
        $this->assertNull($result['photo']);
        $this->assertSame('', $result['fields']['name']);
        $this->assertFalse($result['fields']['idno_valid']); // 无号码 → false
    }

    /** 身份证号校验位：正例 + 各类反例。 */
    #[DataProvider('idNoProvider')]
    public function test_validate_id_no(string $id, bool $expected): void
    {
        $this->assertSame($expected, $this->ocr->validateIdNo($id));
    }

    public static function idNoProvider(): array
    {
        return [
            '合法（校验位 7）' => ['110101199001011237', true],
            '合法样例' => ['440524188001010014', true],
            '末位 X 合法' => ['11010119900307002X', true],
            '末位小写 x 合法' => ['11010119900307002x', true],
            '校验位错' => ['110101199001011234', false],
            '位数不足' => ['11010119900101123', false],
            '位数过多' => ['1101011990010112377', false],
            '含非法字符' => ['11010119900101123A', false],
            '空字符串' => ['', false],
        ];
    }
}
