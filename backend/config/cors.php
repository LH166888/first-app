<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | 本文件覆盖框架默认 CORS 配置。除 max_age 外，其余项均与 Laravel 默认一致，
    | 仅为了打开「预检缓存」而新建此文件。
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // 前端走 Sanctum Bearer token（不依赖 cookie），故沿用 '*' + supports_credentials=false。
    // 若日后要收紧，可改成明确的前端域名列表（如 https://www.aihhyy.cn），属另一改动，本次不动。
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    // 预检缓存：浏览器在此秒数内不再对同一接口重复发 OPTIONS 预检请求。
    // 默认 0 = 每个跨域请求前都先发一次预检（实测每接口多 370~740ms 往返）。
    // 设 86400（24h）后，同源同方法的预检结果被浏览器缓存，几乎消除重复预检。
    // 注意：Chrome 会把此值上限截到 7200s（2h），Firefox 可用满 24h；设大值无副作用。
    'max_age' => 86400,

    // token 模式不需要携带 cookie 凭证，保持 false（与 allowed_origins '*' 兼容）。
    'supports_credentials' => false,

];
