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
            'phone' => 'nullable|regex:/^\+?[0-9]{7,15}$/',
            'city' => 'nullable|string|max:100',
            'organization' => 'nullable|string|max:255',
            'job' => 'nullable|string|max:100',
        ], [
            'name.required' => 'Nama wajib diisi',
            'email.required' => 'Email wajib diisi',
            'email.email' => 'Format email tidak valid',
            'email.unique' => 'Email sudah terdaftar',
            'phone.regex' => 'Nomor telepon harus berupa angka dengan minimal 7 digit (contoh: +62812345678 atau 08123456789)',
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
            'phone' => 'nullable|regex:/^\+?[0-9]{7,15}$/',
            'city' => 'nullable|string|max:100',
            'organization' => 'nullable|string|max:255',
            'job' => 'nullable|string|max:100',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ], [
            'name.required' => 'Nama wajib diisi',
            'email.required' => 'Email wajib diisi',
            'email.email' => 'Format email tidak valid',
            'email.unique' => 'Email sudah terdaftar',
            'phone.regex' => 'Nomor telepon harus berupa angka dengan minimal 7 digit (contoh: +62812345678 atau 08123456789)',
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
                try {
                    $avatar = $request->file('avatar');

                    // Use temp directory approach for Windows/OneDrive compatibility
                    $tempDir = sys_get_temp_dir();
                    $tempFile = $tempDir . DIRECTORY_SEPARATOR . 'avatar_' . uniqid() . '.' . $avatar->getClientOriginalExtension();
                    $avatar->move($tempDir, basename($tempFile));

                    // Delete old avatar if exists
                    if ($user->avatar && file_exists(public_path($user->avatar))) {
                        try {
                            unlink(public_path($user->avatar));
                        } catch (\Exception $e) {
                            // Continue if delete fails
                        }
                    }

                    // Create uploads directory if needed
                    $uploadDir = public_path('uploads' . DIRECTORY_SEPARATOR . 'avatars');
                    @mkdir($uploadDir, 0777, true);

                    // Move from temp to uploads
                    $avatarName = time() . '_' . $user->id . '.' . $avatar->getClientOriginalExtension();
                    $finalPath = $uploadDir . DIRECTORY_SEPARATOR . $avatarName;

                    if (!rename($tempFile, $finalPath)) {
                        throw new \Exception('Failed to move uploaded file to destination');
                    }

                    // Make file readable
                    @chmod($finalPath, 0644);

                    $updateData['avatar'] = '/uploads/avatars/' . $avatarName;
                } catch (\Exception $fileError) {
                    return response()->json([
                        'message' => 'Validasi data gagal. Silakan periksa kembali input Anda.',
                        'errors' => [
                            'avatar' => ['Gagal mengunggah foto profil. Pastikan file adalah gambar dan ukurannya kurang dari 2MB.']
                        ]
                    ], 422);
                }
            }

            // Handle avatar deletion
            if ($request->delete_avatar === 'true' && $user->avatar) {
                try {
                    $avatarPath = public_path($user->avatar);
                    if (file_exists($avatarPath)) {
                        @unlink($avatarPath);
                    }
                } catch (\Exception $e) {
                    // Continue even if delete fails
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
