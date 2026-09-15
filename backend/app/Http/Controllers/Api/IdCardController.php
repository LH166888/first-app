<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BaiduOcrService;
use Illuminate\Http\Request;
use Throwable;

class IdCardController extends Controller
{
    public function __construct(private BaiduOcrService $ocr) {}

    /**
     * 身份证识别。multipart: image(文件), side(front|back)。
     * 返回摆正裁剪图(base64) + 结构化字段 + 风险提示。
     * 图片与文字均不落盘、不落库。需登录（auth:sanctum）。
     */
    public function recognize(Request $request)
    {
        $data = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:4096'], // ≤4MB
            'side' => ['nullable', 'in:front,back'],
        ]);

        $side = $data['side'] ?? 'front';
        $binary = file_get_contents($request->file('image')->getRealPath());

        try {
            $result = $this->ocr->normalize($this->ocr->recognizeIdCard($binary, $side));
        } catch (Throwable $e) {
            // 不把身份证明文写日志；只记类型与消息
            report($e);

            return response()->json(['code' => 5001, 'msg' => '识别服务暂时不可用，请稍后重试'], 502);
        }

        // 图片状态兜底提示（拍反 / 非身份证 / 模糊 / 过曝）
        $tips = [
            'reversed_side' => '正反面拍反了，请上传对应面',
            'non_idcard' => '未检测到身份证，请上传清晰的身份证照片',
            'blurred' => '图片模糊，请重拍',
            'over_exposure' => '图片过曝，请重拍',
        ];

        if (isset($tips[$result['image_status']])) {
            return response()->json(['code' => 4001, 'msg' => $tips[$result['image_status']]], 422);
        }

        return response()->json(['code' => 0, 'msg' => 'ok', 'data' => $result]);
    }
}
