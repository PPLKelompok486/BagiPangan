<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        try {
            $data = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            $user = User::where('email', $data['email'])->first();

            if (!$user || !Hash::check($data['password'], $user->password)) {
                return response()->json([
                    'message' => 'Email atau password salah',
                ], 401);
            }

            $token = Str::random(64);
            $user->forceFill(['remember_token' => $token])->save();

            return response()->json([
                'message' => 'Login berhasil',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'city' => $user->city ?? null,
                    'phone' => $user->phone ?? null,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Login Error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'message' => 'Login gagal',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        if ($user = $request->user()) {
            $user->forceFill(['remember_token' => null])->save();
        }
        return response()->json(['message' => 'Logout berhasil']);
    }
}
