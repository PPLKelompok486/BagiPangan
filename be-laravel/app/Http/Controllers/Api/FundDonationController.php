<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFundDonationRequest;
use App\Http\Requests\UpdateFundDonationRequest;
use App\Models\FundDonation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * @OA\Info(title="BagiPangan Donation API", version="1.0.0")
 */
class FundDonationController extends Controller
{
    /**
     * Display a listing of donations (Admin or User's own)
     */
    public function index()
    {
        $query = FundDonation::with('user');

        if (Auth::user()->role !== 'admin') {
            $query->where('user_id', Auth::id());
        }

        return response()->json($query->latest()->paginate(10));
    }

    /**
     * Store a newly created donation in storage.
     */
    public function store(StoreFundDonationRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = Auth::id();
        $data['payment_status'] = 'pending';
        
        // Mocking Payment Gateway Snap Token Generation
        $data['snap_token'] = Str::random(32);

        $donation = FundDonation::create($data);

        return response()->json([
            'message' => 'Donation created successfully',
            'data' => $donation,
            'payment_url' => "https://app.sandbox.midtrans.com/snap/v2/vtweb/{$donation->snap_token}"
        ], 201);
    }

    /**
     * Display the specified donation.
     */
    public function show(FundDonation $fundDonation)
    {
        $this->authorizeAccess($fundDonation);
        return response()->json($fundDonation->load('user'));
    }

    /**
     * Update the specified donation (Edit with Audit Trail).
     */
    public function update(UpdateFundDonationRequest $request, FundDonation $fundDonation)
    {
        $this->authorizeAccess($fundDonation);
        
        if ($fundDonation->payment_status === 'success') {
            return response()->json(['message' => 'Cannot edit successful donation'], 422);
        }

        $fundDonation->update($request->validated());

        return response()->json([
            'message' => 'Donation updated successfully',
            'data' => $fundDonation
        ]);
    }

    /**
     * Cancel the donation.
     */
    public function cancel(Request $request, FundDonation $fundDonation)
    {
        $this->authorizeAccess($fundDonation);

        $request->validate([
            'cancellation_reason' => 'required|string|max:500'
        ]);

        if ($fundDonation->payment_status !== 'pending') {
            return response()->json(['message' => 'Only pending donations can be cancelled'], 422);
        }

        $fundDonation->update([
            'payment_status' => 'cancelled',
            'cancellation_reason' => $request->cancellation_reason
        ]);

        return response()->json([
            'message' => 'Donation cancelled successfully',
            'data' => $fundDonation
        ]);
    }

    /**
     * Remove the specified donation from storage.
     */
    public function destroy(FundDonation $fundDonation)
    {
        $this->authorizeAccess($fundDonation);
        
        if ($fundDonation->payment_status === 'success' && Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized deletion'], 403);
        }

        $fundDonation->delete();

        return response()->json(['message' => 'Donation deleted successfully']);
    }

    protected function authorizeAccess(FundDonation $donation)
    {
        if (Auth::user()->role !== 'admin' && $donation->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to this donation');
        }
    }
}
