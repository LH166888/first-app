<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // 百度智能云 OCR（身份证识别）：Key 走 env，真实值不进代码库
    'baidu_ocr' => [
        'api_key' => env('BAIDU_OCR_API_KEY'),
        'secret_key' => env('BAIDU_OCR_SECRET_KEY'),
    ],

    // 微信公众号模板消息（默认走官方测试号，免认证免费）：真实值走 env
    'wechat_mp' => [
        'app_id' => env('WECHAT_MP_APP_ID'),
        'app_secret' => env('WECHAT_MP_APP_SECRET'),
        // 默认模板与接收者，方便"给自己推一条"这类固定通知直接用
        'template_id' => env('WECHAT_MP_TEMPLATE_ID'),
        'default_openid' => env('WECHAT_MP_DEFAULT_OPENID'),
    ],

];
