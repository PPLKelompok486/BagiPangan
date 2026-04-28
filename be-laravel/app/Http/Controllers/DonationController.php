<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use App\Services\DonationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class DonationController extends Controller
{
    protected $service;

    public function __construct(DonationService $service)
    {
        $this->service = $service;
    }

    // List donasi milik donatur yang login
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'donatur') {
            return response()->json(['message' => 'Hanya donatur yang dapat mengakses'], 403);
        }
        $donations = $this->service->getDonationsByDonor($user);
        return response()->json(['data' => $donations]);
    }

    // Detail donasi milik donatur
    public function show($id)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'donatur') {
            return response()->json(['message' => 'Hanya donatur yang dapat mengakses'], 403);
        }
        try {
            $donation = $this->service->getDonationDetail($id, $user);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
        }
        return response()->json(['data' => $donation]);
    }

    // Create donasi
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'donatur') {
            return response()->json(['message' => 'Hanya donatur yang dapat mengakses'], 403);
        }
        $data = $request->all();
        if ($request->hasFile('food_photo')) {
            $data['food_photo'] = $request->file('food_photo');
        }
        try {
            $donation = $this->service->createDonation($data, $user);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        }
        return response()->json(['message' => 'Donasi berhasil dibuat', 'data' => $donation], 201);
    }

    // Update donasi
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'donatur') {
            return response()->json(['message' => 'Hanya donatur yang dapat mengakses'], 403);
        }
        $donation = Donation::findOrFail($id);
        $data = $request->all();
        if ($request->hasFile('food_photo')) {
            $data['food_photo'] = $request->file('food_photo');
        }
        try {
            $donation = $this->service->updateDonation($donation, $data, $user);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        }
        return response()->json(['message' => 'Donasi berhasil diperbarui', 'data' => $donation]);
    }

    // Delete donasi
    public function destroy($id)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'donatur') {
            return response()->json(['message' => 'Hanya donatur yang dapat mengakses'], 403);
        }
        $donation = Donation::findOrFail($id);
        $this->service->deleteDonation($donation, $user);
        return response()->json(['message' => 'Donasi berhasil dihapus']);
    }

    // ...fungsi claim dan lain-lain tetap...
}
