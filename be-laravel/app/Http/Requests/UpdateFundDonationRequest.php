<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFundDonationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'donor_name' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:1000',
            'donation_date' => 'sometimes|required|date',
            'payment_method' => 'sometimes|required|string',
            'additional_details' => 'nullable|string',
            'payment_status' => 'sometimes|required|in:pending,success,failed,cancelled',
        ];
    }
}
