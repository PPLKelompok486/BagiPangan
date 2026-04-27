<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Display the user's profile.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'User not authenticated'
            ], 401);
        }

        return response()->json([
            'message' => 'Profile retrieved successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'city' => $user->city,
                'organization' => $user->organization,
                'job' => $user->job,
                'role' => $user->role,
                'avatar' => $user->avatar,
            ]
        ]);
    }

    /**
     * Store a new profile (for admin use or initial setup).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|digits_between:8,15',
            'city' => 'nullable|string|max:100',
            'organization' => 'nullable|string|max:255',
            'job' => 'nullable|string|max:100',
        ], [
            'name.required' => 'Nama wajib diisi',
            'email.required' => 'Email wajib diisi',
            'email.email' => 'Format email tidak valid',
            'email.unique' => 'Email sudah terdaftar',
            'phone.digits_between' => 'Nomor telepon harus berupa angka 8-15 digit',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi data gagal. Silakan periksa kembali input Anda.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'city' => $request->city,
                'organization' => $request->organization,
                'job' => $request->job,
            ]);

            return response()->json([
                'message' => 'Informasi profile akun berhasil disimpan.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'city' => $user->city,
                    'organization' => $user->organization,
                    'job' => $user->job,
                    'role' => $user->role,
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan saat menyimpan profil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the user's profile.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'User not authenticated'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|digits_between:8,15',
            'city' => 'nullable|string|max:100',
            'organization' => 'nullable|string|max:255',
            'job' => 'nullable|string|max:100',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ], [
            'name.required' => 'Nama wajib diisi',
            'email.required' => 'Email wajib diisi',
            'email.email' => 'Format email tidak valid',
            'email.unique' => 'Email sudah terdaftar',
            'phone.digits_between' => 'Nomor telepon harus berupa angka 8-15 digit',
            'avatar.image' => 'Avatar harus berupa gambar',
            'avatar.mimes' => 'Avatar harus berformat jpeg, png, jpg, atau gif',
            'avatar.max' => 'Ukuran avatar maksimal 2MB',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi data gagal. Silakan periksa kembali input Anda.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = [
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'city' => $request->city,
                'organization' => $request->organization,
                'job' => $request->job,
            ];

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                $avatar = $request->file('avatar');
                $avatarName = time() . '_' . $user->id . '.' . $avatar->getClientOriginalExtension();
                $avatar->move(public_path('uploads/avatars'), $avatarName);
                $updateData['avatar'] = '/uploads/avatars/' . $avatarName;
            }

            // Handle avatar deletion
            if ($request->delete_avatar === 'true' && $user->avatar) {
                // Delete old avatar file if exists
                $oldAvatarPath = public_path($user->avatar);
                if (file_exists($oldAvatarPath)) {
                    unlink($oldAvatarPath);
                }
                $updateData['avatar'] = null;
            }

            $user->update($updateData);

            return response()->json([
                'message' => 'Informasi profile akun berhasil diperbarui.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'city' => $user->city,
                    'organization' => $user->organization,
                    'job' => $user->job,
                    'role' => $user->role,
                    'avatar' => $user->avatar,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan saat memperbarui profil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'User not authenticated'
            ], 401);
        }

        try {
            $user->delete();

            return response()->json([
                'message' => 'Informasi profile akun berhasil dihapus.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan saat menghapus profil',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
