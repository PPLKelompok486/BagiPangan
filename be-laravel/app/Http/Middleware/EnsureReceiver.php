<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureReceiver
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'penerima') {
            return response()->json([
                'message' => 'Hanya akun penerima yang dapat mengakses fitur ini.',
            ], 403);
        }

        return $next($request);
    }
}
