<?php

namespace App\Http\Requests\Games;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;

class StoreFishingScoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'score'     => ['required', 'integer', 'min:0', 'max:999999'],
            'coins_won' => ['required', 'integer', 'min:0', 'max:999999'],
        ];
    }

    /**
     * 反作弊：分数超过可配置阈值（默认 500000）视为异常高分，直接拒绝。
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $maxScore = (int) config('games.fishing.max_score', 500000);

            if ((int) $this->input('score') > $maxScore) {
                $validator->errors()->add('score', '分数异常，可能的作弊行为');
            }
        });
    }
}
