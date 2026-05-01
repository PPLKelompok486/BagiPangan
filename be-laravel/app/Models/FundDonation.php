<?php

namespace App\Models;

use App\Traits\HasAuditTrail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FundDonation extends Model
{
    use HasFactory, HasAuditTrail;

    protected $fillable = [
        'user_id',
        'donor_name',
        'amount',
        'donation_date',
        'payment_method',
        'payment_status',
        'snap_token',
        'cancellation_reason',
        'additional_details',
    ];

    protected $casts = [
        'donation_date' => 'date',
        'amount' => 'decimal:2',
    ];

    /**
     * The donor user (if registered)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
