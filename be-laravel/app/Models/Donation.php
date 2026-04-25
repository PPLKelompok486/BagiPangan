<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'donor_id', 'receiver_id', 'title', 'description', 'quantity',
    'pickup_address', 'pickup_time', 'status', 'claimed_at',
])]
class Donation extends Model
{
    protected function casts(): array
    {
        return [
            'pickup_time' => 'datetime',
            'claimed_at' => 'datetime',
        ];
    }

    public function donor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'donor_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function proof(): HasOne
    {
        return $this->hasOne(Proof::class);
    }
}
