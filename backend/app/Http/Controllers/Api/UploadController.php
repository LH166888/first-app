<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * 生成 R2 预签名 PUT URL，前端拿到后直传（浏览器 → R2，不经后端）。
     * body: { filename, content_type }
     * 返回 { upload_url, headers, key, public_url }。
     *
     * 注意：前端用返回的 upload_url 做 PUT 时不带 Sanctum 头，
     * 只带 headers 里指定的 Content-Type（签名的一部分）。
     */
    public function presign(Request $request)
    {
        $data = $request->validate([
            'filename' => ['required', 'string', 'max:255'],
            'content_type' => ['required', 'string', 'starts_with:image/'],
        ]);

        // 生成对象 key：menu/年/月/uuid-安全文件名
        $ext = pathinfo($data['filename'], PATHINFO_EXTENSION);
        $safeExt = preg_match('/^[a-zA-Z0-9]{1,10}$/', $ext) ? strtolower($ext) : 'jpg';
        $key = sprintf('menu/%s/%s/%s.%s', date('Y'), date('m'), Str::uuid(), $safeExt);

        $disk = Storage::disk('s3');

        // Laravel 内置：生成带签名的临时上传 URL（10 分钟有效）
        $signed = $disk->temporaryUploadUrl(
            $key,
            now()->addMinutes(10),
            ['Content-Type' => $data['content_type']]
        );

        $publicBase = rtrim((string) env('R2_PUBLIC_BASE_URL'), '/');

        return response()->json([
            'upload_url' => $signed['url'],
            'headers' => $signed['headers'] ?? ['Content-Type' => $data['content_type']],
            'key' => $key,
            'public_url' => $publicBase.'/'.$key,
        ]);
    }
}
