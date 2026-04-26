<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Donation extends Model
{
    use HasFactory;

    public const STATUS_AVAILABLE = 'available';
    public const STATUS_CLAIMED = 'claimed';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'donor_id',
        'receiver_id',
        'title',
        'description',
        'quantity',
        'pickup_address',
        'pickup_time',
        'status',
        'claimed_at',
    ];

    protected function casts(): array
    {
        return [
            'pickup_time' => 'datetime',
            'claimed_at' => 'datetime',
        ];
    }

    public function donor()
    {
        return $this->belongsTo(User::class, 'donor_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
