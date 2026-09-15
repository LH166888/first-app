<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class IdCardRecognizeTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/tools/idcard/recognize';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.baidu_ocr.api_key', 'test-ak');
        config()->set('services.baidu_ocr.secret_key', 'test-sk');
    }

    /** 造一张 1x1 的真实 PNG，满足 image/mimes 校验。 */
    private function fakeImage(string $name = 'idcard.png'): UploadedFile
    {
        return UploadedFile::fake()->image($name, 100, 60);
    }

    /** 打桩百度：token + 身份证识别。 */
    private function fakeBaidu(array $idcardResponse): void
    {
        Http::fake([
            '*oauth*' => Http::response(['access_token' => 'tok-1']),
            '*idcard*' => Http::response($idcardResponse),
        ]);
    }

    /** 未登录必须 401，且不消耗百度额度。 */
    public function test_requires_authentication(): void
    {
        Http::fake();

        $this->postJson(self::ENDPOINT, ['image' => $this->fakeImage()])
            ->assertStatus(401);

        Http::assertNothingSent();
    }

    /** 正常识别：扁平结构 + code=0 + 字段齐全。 */
    public function test_recognize_success(): void
    {
        $this->fakeBaidu([
            'image_status' => 'normal',
            'words_result' => [
                '姓名' => ['words' => '张三'],
                '性别' => ['words' => '男'],
                '民族' => ['words' => '汉'],
                '出生' => ['words' => '19900101'],
                '住址' => ['words' => '北京市朝阳区某路 1 号'],
                '公民身份号码' => ['words' => '110101199001011237'],
            ],
            'card_image' => 'AAAA',
            'photo' => 'BBBB',
            'risk_type' => 'normal',
        ]);

        $response = $this->actingAs(User::factory()->create())
            ->post(self::ENDPOINT, ['image' => $this->fakeImage(), 'side' => 'front']);

        $response->assertOk()
            ->assertJsonPath('code', 0)
            ->assertJsonPath('data.fields.name', '张三')
            ->assertJsonPath('data.fields.idno', '110101199001011237')
            ->assertJsonPath('data.fields.idno_valid', true)
            ->assertJsonPath('data.card_image', 'data:image/jpeg;base64,AAAA')
            ->assertJsonPath('data.image_status', 'normal');
    }

    /** 背面识别：返回签发机关与有效期。 */
    public function test_recognize_back_side(): void
    {
        $this->fakeBaidu([
            'image_status' => 'normal',
            'words_result' => [
                '签发机关' => ['words' => '北京市公安局'],
                '签发日期' => ['words' => '2020.01.01'],
                '失效日期' => ['words' => '2030.01.01'],
            ],
        ]);

        $this->actingAs(User::factory()->create())
            ->post(self::ENDPOINT, ['image' => $this->fakeImage(), 'side' => 'back'])
            ->assertOk()
            ->assertJsonPath('data.fields.authority', '北京市公安局')
            ->assertJsonPath('data.fields.valid_date', '2030.01.01')
            ->assertJsonPath('data.fields.issue_date', '2020.01.01');
    }

    /** 异常图片状态 → 4001 / 422 + 对应中文提示。 */
    #[DataProvider('imageStatusProvider')]
    public function test_abnormal_image_status_gives_hint(string $status, string $expectedMsg): void
    {
        $this->fakeBaidu(['image_status' => $status, 'words_result' => []]);

        $this->actingAs(User::factory()->create())
            ->post(self::ENDPOINT, ['image' => $this->fakeImage()])
            ->assertStatus(422)
            ->assertJsonPath('code', 4001)
            ->assertJsonPath('msg', $expectedMsg);
    }

    public static function imageStatusProvider(): array
    {
        return [
            '拍反' => ['reversed_side', '正反面拍反了，请上传对应面'],
            '非身份证' => ['non_idcard', '未检测到身份证，请上传清晰的身份证照片'],
            '模糊' => ['blurred', '图片模糊，请重拍'],
            '过曝' => ['over_exposure', '图片过曝，请重拍'],
        ];
    }

    /** 缺文件 → 422 表单校验错误。 */
    public function test_missing_file_fails_validation(): void
    {
        Http::fake();

        $this->actingAs(User::factory()->create())
            ->postJson(self::ENDPOINT, [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('image');

        Http::assertNothingSent();
    }

    /** 非图片文件 → 422。 */
    public function test_non_image_file_fails_validation(): void
    {
        Http::fake();

        $this->actingAs(User::factory()->create())
            ->post(self::ENDPOINT, [
                'image' => UploadedFile::fake()->create('doc.pdf', 10, 'application/pdf'),
            ], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('image');

        Http::assertNothingSent();
    }

    /** 超过 4MB → 422。 */
    public function test_oversized_file_fails_validation(): void
    {
        Http::fake();

        $this->actingAs(User::factory()->create())
            ->post(self::ENDPOINT, [
                'image' => UploadedFile::fake()->image('big.png')->size(5120), // 5MB
            ], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('image');

        Http::assertNothingSent();
    }

    /** side 取值非法 → 422。 */
    public function test_invalid_side_fails_validation(): void
    {
        Http::fake();

        $this->actingAs(User::factory()->create())
            ->post(self::ENDPOINT, ['image' => $this->fakeImage(), 'side' => 'middle'], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('side');
    }

    /** 百度网络异常 → 502 / 5001 友好提示。 */
    public function test_baidu_network_failure_gives_502(): void
    {
        Http::fake([
            '*oauth*' => Http::response(['access_token' => 'tok-1']),
            '*idcard*' => fn () => throw new \Illuminate\Http\Client\ConnectionException('timed out'),
        ]);

        $this->actingAs(User::factory()->create())
            ->post(self::ENDPOINT, ['image' => $this->fakeImage()])
            ->assertStatus(502)
            ->assertJsonPath('code', 5001)
            ->assertJsonPath('msg', '识别服务暂时不可用，请稍后重试');
    }

    /** 额度/QPS 类错误 → 归 5001。 */
    #[DataProvider('quotaErrorProvider')]
    public function test_quota_errors_give_5001(int $errorCode): void
    {
        $this->fakeBaidu(['error_code' => $errorCode, 'error_msg' => 'quota']);

        $this->actingAs(User::factory()->create())
            ->post(self::ENDPOINT, ['image' => $this->fakeImage()])
            ->assertStatus(502)
            ->assertJsonPath('code', 5001);
    }

    public static function quotaErrorProvider(): array
    {
        return [
            '当日额度用尽' => [17],
            'QPS 超限' => [18],
        ];
    }

    /** 响应体里不得出现百度原始错误信息（防信息外泄）。 */
    public function test_error_response_hides_baidu_detail(): void
    {
        $this->fakeBaidu(['error_code' => 17, 'error_msg' => 'internal-quota-detail']);

        $response = $this->actingAs(User::factory()->create())
            ->post(self::ENDPOINT, ['image' => $this->fakeImage()]);

        $this->assertStringNotContainsString('internal-quota-detail', $response->getContent());
    }
}
