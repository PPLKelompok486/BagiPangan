<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'donation_id', 'receiver_id', 'image_path', 'image_url', 'uploaded_at',
])]
class Proof extends Model
{
    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
        ];
    }

    public function donation(): BelongsTo
    {
        return $this->belongsTo(Donation::class);
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
