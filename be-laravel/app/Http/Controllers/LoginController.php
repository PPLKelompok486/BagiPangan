<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
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
            $rateLimitKey = $this->rateLimitKey($request, $data['email']);

            if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
                return response()->json([
                    'message' => 'Akun terkunci sementara karena terlalu banyak percobaan login gagal.',
                    'retry_after' => RateLimiter::availableIn($rateLimitKey),
                ], 429);
            }

            if (!$user || !Hash::check($data['password'], $user->password)) {
                RateLimiter::hit($rateLimitKey, 60);

                return response()->json([
                    'message' => 'Email atau password salah',
                ], 401);
            }

            if (!$user->is_active) {
                return response()->json([
                    'message' => 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.',
                ], 403);
            }

            RateLimiter::clear($rateLimitKey);

            $token = Str::random(64);
            $user->forceFill(['remember_token' => hash('sha256', $token)])->save();

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
            ], 500);
        }
    }

    private function rateLimitKey(Request $request, string $email): string
    {
        return 'login:' . strtolower($email) . '|' . $request->ip();
    }

    public function logout(Request $request)
    {
        if ($user = $request->user()) {
            $user->forceFill(['remember_token' => null])->save();
        }
        return response()->json(['message' => 'Logout berhasil']);
    }
}
