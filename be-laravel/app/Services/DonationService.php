<?php

namespace App\Services;

use App\Models\Donation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class DonationService
{
    public function createDonation(array $data, $user)
    {
        $validator = Validator::make($data, [
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:donation_categories,id',
            'description' => 'required|string',
            'portion_count' => 'required|integer|min:1',
            'available_until' => 'required|date',
            'location_address' => 'required|string',
            'food_photo' => 'nullable|image|max:2048',
        ]);
        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $donation = new Donation();
        $donation->user_id = $user->id;
        $donation->category_id = $data['category_id'];
        $donation->title = $data['title'];
        $donation->description = $data['description'];
        $donation->portion_count = $data['portion_count'];
        $donation->available_until = $data['available_until'];
        $donation->location_city = $user->city ?? 'Unknown'; // Ambil dari profile user atau default
        $donation->location_address = $data['location_address'];
        $donation->status = 'pending'; // Status awal adalah pending
        if (isset($data['food_photo'])) {
            $donation->food_photo_url = $this->storePhoto($data['food_photo']);
        }
        $donation->save();
        return $donation;
    }

    public function updateDonation(Donation $donation, array $data, $user)
    {
        if ($donation->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }
        $validator = Validator::make($data, [
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:donation_categories,id',
            'description' => 'required|string',
            'portion_count' => 'required|integer|min:1',
            'available_until' => 'required|date',
            'location_address' => 'required|string',
            'food_photo' => 'nullable|image|max:2048',
        ]);
        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
        $donation->category_id = $data['category_id'];
        $donation->title = $data['title'];
        $donation->description = $data['description'];
        $donation->portion_count = $data['portion_count'];
        $donation->available_until = $data['available_until'];
        $donation->location_city = $user->city ?? 'Unknown';
        $donation->location_address = $data['location_address'];
        if (isset($data['food_photo'])) {
            $donation->food_photo_url = $this->storePhoto($data['food_photo']);
        }
        $donation->save();
        return $donation;
    }

    public function getDonationsByDonor($user)
    {
        return Donation::where('user_id', $user->id)->orderByDesc('created_at')->get();
    }

    public function getDonationDetail($id, $user)
    {
        $donation = Donation::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        return $donation;
    }

    public function deleteDonation(Donation $donation, $user)
    {
        if ($donation->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }
        $donation->delete();
        return true;
    }

    private function storePhoto($file)
    {
        return Storage::disk('public')->put('donation_photos', $file);
    }
}
