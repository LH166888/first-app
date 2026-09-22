<?php

namespace App\Http\Requests\Menu;

use Illuminate\Foundation\Http\FormRequest;

class StoreDishRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                   => ['required', 'string', 'max:100'],
            'image_key'              => ['nullable', 'string', 'max:255'],
            'ingredients'            => ['required', 'array', 'min:1'],
            'ingredients.*.name'     => ['required', 'string', 'max:50'],
            'ingredients.*.amount'   => ['nullable', 'string', 'max:50'],
            'steps'                  => ['required', 'array', 'min:1'],
            'steps.*.description'    => ['required', 'string', 'max:500'],
        ];
    }
}
