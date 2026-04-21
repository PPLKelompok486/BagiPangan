<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Forbidden. Admin access only.',
            ], 403);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Account is deactivated.',
            ], 403);
        }

        return $next($request);
    }
}
