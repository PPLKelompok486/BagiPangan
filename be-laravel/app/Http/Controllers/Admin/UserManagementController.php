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
        $perPage = $this->resolvePerPage($request->query('per_page'));

        $users = User::withTrashed()
            ->when($search, function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'message' => 'Daftar pengguna berhasil diambil',
            'data' => $users,
        ]);
    }

    private function resolvePerPage($value): int
    {
        $perPage = (int) $value;

        if ($perPage <= 0) {
            return 100;
        }

        return min($perPage, 500);
    }

    public function update(Request $request, User $user)
    {
        $payload = $request->validate([
            'role' => 'sometimes|required|in:donatur,penerima',
            'is_admin' => 'sometimes|required|boolean',
            'is_active' => 'sometimes|required|boolean',
        ]);

        if (array_key_exists('is_active', $payload) && $payload['is_active'] === false) {
            if ($user->isAdmin()) {
                return response()->json([
                    'message' => 'Akun administrator tidak dapat dinonaktifkan.'
                ], 403);
            }
            $payload['deactivated_at'] = now();
            $user->forceFill(['remember_token' => null])->save();
        }

        if (array_key_exists('is_active', $payload) && $payload['is_active'] === true) {
            $payload['deactivated_at'] = null;
        }

        $user->update($payload);

        ActivityLog::record(
            'user.updated',
            'user',
            $user->id,
            $payload,
            $request->user()->id,
        );

        return response()->json([
            'message' => 'Data pengguna berhasil diperbarui',
            'data' => $user,
        ]);
    }

    public function deactivate(Request $request, User $user)
    {
        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Akun administrator tidak dapat dinonaktifkan.'
            ], 403);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Akun sudah dalam keadaan nonaktif.'
            ], 422);
        }

        $user->update([
            'is_active' => false,
            'deactivated_at' => now(),
        ]);
        $user->forceFill(['remember_token' => null])->save();

        ActivityLog::record(
            'user.deactivated',
            'user',
            $user->id,
            ['name' => $user->name, 'email' => $user->email],
            $request->user()->id
        );

        return response()->json([
            'message' => 'Akun pengguna berhasil dinonaktifkan.',
            'data' => $user,
        ]);
    }

    public function activate(Request $request, User $user)
    {
        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Akun administrator selalu aktif.'
            ], 403);
        }

        if ($user->is_active) {
            return response()->json([
                'message' => 'Akun sudah dalam keadaan aktif.'
            ], 422);
        }

        $user->update([
            'is_active' => true,
            'deactivated_at' => null,
        ]);

        ActivityLog::record(
            'user.activated',
            'user',
            $user->id,
            ['name' => $user->name, 'email' => $user->email],
            $request->user()->id
        );

        return response()->json([
            'message' => 'Akun pengguna berhasil diaktifkan.',
            'data' => $user,
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Akun administrator tidak dapat dihapus.'
            ], 403);
        }

        $user->update([
            'is_active' => false,
            'deactivated_at' => now(),
        ]);
        $user->forceFill(['remember_token' => null])->save();

        $user->delete();

        ActivityLog::record(
            'user.deleted',
            'user',
            $user->id,
            ['name' => $user->name, 'email' => $user->email, 'grace_period_days' => 7],
            $request->user()->id
        );

        return response()->json([
            'message' => 'Akun pengguna berhasil dihapus (dalam masa tenggang 7 hari).',
            'data' => $user,
        ]);
    }

    public function restore(Request $request, $id)
    {
        $user = User::onlyTrashed()->find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Akun pengguna tidak ditemukan atau tidak berada dalam masa tenggang.'
            ], 404);
        }

        $user->restore();

        $user->update([
            'is_active' => true,
            'deactivated_at' => null,
        ]);

        ActivityLog::record(
            'user.restored',
            'user',
            $user->id,
            ['name' => $user->name, 'email' => $user->email],
            $request->user()->id
        );

        return response()->json([
            'message' => 'Akun pengguna berhasil dipulihkan.',
            'data' => $user,
        ]);
    }
}
