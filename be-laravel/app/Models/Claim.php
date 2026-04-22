<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Claim extends Model
{
    use HasFactory;

    public const STATUS_REQUESTED = 'requested';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'donation_id',
        'receiver_id',
        'status',
        'cancel_reason',
        'proof_image_url',
        'claimed_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'claimed_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function donation()
    {
        return $this->belongsTo(Donation::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
