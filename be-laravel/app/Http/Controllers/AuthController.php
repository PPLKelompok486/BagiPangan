<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private const RESET_TABLE = 'password_reset_tokens';

    /** Reset tokens older than this are rejected. */
    private const TOKEN_TTL_MINUTES = 60;

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // Respond identically whether or not the email exists so the endpoint
        // cannot be used to enumerate registered accounts.
        $payload = [
            'message' => 'Permintaan reset password telah diproses. Silakan periksa email Anda.',
        ];

        if ($user) {
            $token = Str::random(60);

            DB::table(self::RESET_TABLE)->updateOrInsert(
                ['email' => $request->email],
                ['token' => Hash::make($token), 'created_at' => now()]
            );

            // Only expose the raw token to local/dev runs. In production the token
            // must reach the user out-of-band (email) — see backlog B-EMAIL.
            if (config('app.debug')) {
                $payload['debug_token'] = $token;
            }
        }

        return response()->json($payload);
    }

    public function resetPassword(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'token' => 'required',
                'password' => 'required|min:8|confirmed',
            ]);

            $reset = DB::table(self::RESET_TABLE)->where('email', $request->email)->first();

            if (!$reset) {
                return response()->json(['message' => 'Permintaan reset tidak ditemukan untuk email ini.'], 400);
            }

            if (!Hash::check($request->token, $reset->token)) {
                return response()->json(['message' => 'Token tidak valid.'], 400);
            }

            if (!$reset->created_at || now()->diffInMinutes($reset->created_at, true) > self::TOKEN_TTL_MINUTES) {
                DB::table(self::RESET_TABLE)->where('email', $request->email)->delete();

                return response()->json(['message' => 'Token sudah kedaluwarsa. Silakan minta reset ulang.'], 400);
            }

            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return response()->json(['message' => 'User tidak ditemukan.'], 404);
            }

            $user->password = Hash::make($request->password);
            $user->save();

            DB::table(self::RESET_TABLE)->where('email', $request->email)->delete();

            return response()->json(['message' => 'Password berhasil diperbarui.']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal: ' . implode(', ', $e->validator->errors()->all())], 422);
        } catch (\Exception $e) {
            Log::error('reset_password failed', ['exception' => $e]);
            return response()->json(['message' => 'Terjadi kesalahan server.'], 500);
        }
    }
}
