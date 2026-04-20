<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\RegisterService;
use Illuminate\Validation\ValidationException;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        $service = new RegisterService();
        try {
            $user = $service->register($request->all());
            $token = $user->createToken('api')->plainTextToken;
            return response()->json([
                'message' => 'Registrasi Berhasil',
                'token' => $token,
                'user' => $user,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Registrasi Gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Register Error: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
            ]);
            return response()->json([
                'message' => 'Registrasi Gagal: ' . $e->getMessage(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
