<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');

        $users = User::query()
            ->when($search, function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(12);

        return response()->json([
            'message' => 'Daftar pengguna berhasil diambil',
            'data' => $users,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $payload = $request->validate([
            'role' => 'sometimes|required|in:donatur,penerima',
            'is_admin' => 'sometimes|required|boolean',
            'is_active' => 'sometimes|required|boolean',
        ]);

        if (array_key_exists('is_active', $payload) && $payload['is_active'] === false) {
            $payload['deactivated_at'] = now();
        }

        if (array_key_exists('is_active', $payload) && $payload['is_active'] === true) {
            $payload['deactivated_at'] = null;
        }

        $user->update($payload);

        ActivityLog::create([
            'actor_user_id' => $request->user()->id,
            'action' => 'user.updated',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'metadata' => $payload,
        ]);

        return response()->json([
            'message' => 'Data pengguna berhasil diperbarui',
            'data' => $user,
        ]);
    }
}
