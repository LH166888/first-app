<?php

namespace App\Http\Requests\Menu;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'to_user_id' => ['required', 'integer', 'exists:users,id'],
            'dish_ids'   => ['required', 'array', 'min:1'],
            'dish_ids.*' => ['integer'],
            'note'       => ['nullable', 'string', 'max:100'],
        ];
    }
}
