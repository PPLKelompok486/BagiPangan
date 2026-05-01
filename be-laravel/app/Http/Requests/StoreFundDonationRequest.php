<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFundDonationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'donor_name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1000',
            'donation_date' => 'required|date',
            'payment_method' => 'required|string|in:credit_card,bank_transfer,gopay,shopeepay',
            'additional_details' => 'nullable|string',
        ];
    }
}
