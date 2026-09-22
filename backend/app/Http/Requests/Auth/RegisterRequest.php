<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    /** 账号格式：字母/数字/@/.，长度 3-18。 */
    private const ACCOUNT_RULE = ['required', 'string', 'regex:/^[A-Za-z0-9@.]{3,18}$/'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'account'     => [...self::ACCOUNT_RULE, 'unique:users,account'],
            'password'    => ['required', 'string', 'min:6'],
            'invite_code' => ['required', 'string'],
        ];
    }
}
