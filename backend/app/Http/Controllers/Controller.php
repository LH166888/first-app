<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * 从请求中解析分页参数。
     * per_page 上限 50，超出夹到 50；低于 1 夹到 1。
     *
     * @return array{int, int} [$page, $perPage]
     */
    protected function getPaginationParams(Request $request): array
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 50));
        $page    = max(1, (int) $request->query('page', 1));

        return [$page, $perPage];
    }
}
