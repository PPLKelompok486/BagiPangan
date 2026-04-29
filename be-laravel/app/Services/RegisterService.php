<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class RegisterService
{
    public function register(array $data)
    {
        $validator = Validator::make($data, [
            'role'             => 'required|in:donatur,penerima',
            'name'             => 'required|string|max:255',
            'email'            => 'required|email|unique:users,email',
            'password'         => [
                'required',
                'string',
                'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
            ],
            // password_confirmation is optional here — auth is handled by Supabase
            'password_confirmation' => 'nullable|same:password',
            'phone'            => 'required|digits_between:8,15',
            'city'             => 'required|string|max:100',
            'organization'     => 'nullable|string|max:255',
            'job'              => 'nullable|string|max:100',
        ], [
            'role.required'                   => 'Peran wajib dipilih',
            'role.in'                         => 'Peran tidak valid',
            'name.required'                   => 'Nama wajib diisi',
            'email.required'                  => 'Email wajib diisi',
            'email.email'                     => 'Format email tidak valid',
            'email.unique'                    => 'Email sudah terdaftar',
            'password.required'               => 'Password wajib diisi',
            'password.min'                    => 'Password minimal 8 karakter',
            'password.regex'                  => 'Password harus kombinasi huruf besar, kecil, dan angka',
            'password_confirmation.same'      => 'Password dan konfirmasi harus sama',
            'phone.required'                  => 'Nomor telepon wajib diisi',
            'phone.digits_between'            => 'Nomor telepon harus berupa angka 8-15 digit',
            'city.required'                   => 'Kota wajib diisi',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $user = User::create([
            'role'         => $data['role'],
            'name'         => $data['name'],
            'email'        => $data['email'],
            'password'     => Hash::make($data['password']),
            'phone'        => $data['phone'] ?? null,
            'city'         => $data['city'] ?? null,
            'organization' => $data['organization'] ?? null,
            'job'          => $data['job'] ?? null,
        ]);

        return $user;
    }
}
