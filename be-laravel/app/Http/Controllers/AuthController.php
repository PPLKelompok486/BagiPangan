<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.',
            ], 401);
        }

        return response()->json([
            'message' => 'Login berhasil',
            'user' => $user,
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json(['message' => 'Email tidak ditemukan.'], 404);
        }

        $token = Str::random(60);
        
        // Cek nama tabel yang benar
        $tableName = Schema::hasTable('password_reset_tokens') ? 'password_reset_tokens' : 'password_resets';

        DB::table($tableName)->updateOrInsert(
            ['email' => $request->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        return response()->json([
            'message' => 'Link reset password telah dibuat (Simulasi)',
            'debug_token' => $token
        ]);
    }

    public function resetPassword(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'token' => 'required',
                'password' => 'required|min:8|confirmed',
            ]);

            $tableName = Schema::hasTable('password_reset_tokens') ? 'password_reset_tokens' : 'password_resets';
            $reset = DB::table($tableName)->where('email', $request->email)->first();

            if (!$reset) {
                return response()->json(['message' => 'Permintaan reset tidak ditemukan untuk email ini.'], 400);
            }

            if (!Hash::check($request->token, $reset->token)) {
                return response()->json(['message' => 'Token tidak valid.'], 400);
            }

            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return response()->json(['message' => 'User tidak ditemukan.'], 404);
            }

            $user->password = Hash::make($request->password);
            $user->save();

            DB::table($tableName)->where('email', $request->email)->delete();

            return response()->json(['message' => 'Password berhasil diperbarui.']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal: ' . implode(', ', $e->validator->errors()->all())], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan server: ' . $e->getMessage()], 500);
        }
    }
}
