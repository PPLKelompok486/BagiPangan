<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class TokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');

        // Log for debugging
        Log::info('TokenAuth middleware called', ['header' => $header]);

        if (!str_starts_with($header, 'Bearer ')) {
            Log::warning('Invalid authorization header format');
            return response()->json(['message' => 'Unauthenticated - Invalid header format'], 401);
        }

        $token = trim(substr($header, 7));
        if ($token === '') {
            Log::warning('Empty token');
            return response()->json(['message' => 'Unauthenticated - Empty token'], 401);
        }

        $user = User::where('remember_token', $token)->first();
        if (!$user) {
            Log::warning('User not found for token', ['token' => substr($token, 0, 10) . '...']);
            return response()->json(['message' => 'Unauthenticated - Invalid token'], 401);
        }

        Log::info('User authenticated successfully', ['user_id' => $user->id]);
        $request->setUserResolver(fn () => $user);
        \Illuminate\Support\Facades\Auth::setUser($user);
        return $next($request);
    }
}
