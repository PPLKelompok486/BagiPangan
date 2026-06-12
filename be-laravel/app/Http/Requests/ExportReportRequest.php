<?php

namespace App\Http\Requests;

use App\Models\Donation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExportReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $allowedStatuses = [
            Donation::STATUS_PENDING,
            Donation::STATUS_APPROVED,
            Donation::STATUS_REJECTED,
            Donation::STATUS_CLAIMED,
            Donation::STATUS_COMPLETED,
            Donation::STATUS_CANCELLED,
        ];

        return [
            'date_from' => ['required', 'date_format:Y-m-d'],
            'date_to' => ['required', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'status' => ['nullable', 'string', Rule::in($allowedStatuses)],
            'donor_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'date_from.required' => 'Tanggal mulai wajib diisi.',
            'date_from.date_format' => 'Format tanggal mulai harus YYYY-MM-DD.',
            'date_to.required' => 'Tanggal akhir wajib diisi.',
            'date_to.date_format' => 'Format tanggal akhir harus YYYY-MM-DD.',
            'date_to.after_or_equal' => 'Tanggal akhir harus lebih besar atau sama dengan tanggal mulai.',
            'status.in' => 'Status tidak valid.',
            'donor_id.exists' => 'Donatur tidak ditemukan.',
        ];
    }
}
