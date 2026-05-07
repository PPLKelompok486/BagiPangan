<?php

namespace App\Models;

use App\Traits\HasAuditTrail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Donation extends Model
{
    use HasFactory, HasAuditTrail;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CLAIMED = 'claimed';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'description',
        'location_city',
        'location_address',
        'latitude',
        'longitude',
        'address_detail',
        'available_from',
        'available_until',
        'portion_count',
        'status',
        'approved_by',
        'approved_at',
        'rejected_reason',
    ];

    protected $casts = [
        'available_from' => 'datetime',
        'available_until' => 'datetime',
        'approved_at' => 'datetime',
        'portion_count' => 'integer',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(DonationCategory::class, 'category_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // The public-facing "available" status maps to the internal "approved"
    // status (admin-approved donation, not yet claimed).
    public const PUBLIC_STATUS_MAP = [
        'available' => self::STATUS_APPROVED,
        'claimed'   => self::STATUS_CLAIMED,
        'completed' => self::STATUS_COMPLETED,
    ];

    public function scopeByKeyword(Builder $query, ?string $keyword): Builder
    {
        $keyword = is_string($keyword) ? trim($keyword) : '';
        if ($keyword === '') {
            return $query;
        }

        $like = '%' . $keyword . '%';

        return $query->where(function (Builder $q) use ($like) {
            $q->where('title', 'LIKE', $like)
              ->orWhere('description', 'LIKE', $like);
        });
    }

    public function scopeByCategory(Builder $query, $categoryId): Builder
    {
        if ($categoryId === null || $categoryId === '') {
            return $query;
        }

        return $query->where('category_id', (int) $categoryId);
    }

    public function scopeByLocation(Builder $query, ?string $location): Builder
    {
        $location = is_string($location) ? trim($location) : '';
        if ($location === '') {
            return $query;
        }

        $like = '%' . $location . '%';

        // Donor city lives on the user, but donations also store a snapshot in
        // location_city — match either so seed/legacy rows still surface.
        return $query->where(function (Builder $q) use ($like) {
            $q->where('location_city', 'LIKE', $like)
              ->orWhereHas('user', function (Builder $u) use ($like) {
                  $u->where('city', 'LIKE', $like);
              });
        });
    }

    public function scopeByStatus(Builder $query, ?string $status): Builder
    {
        if (!is_string($status) || $status === '') {
            return $query;
        }

        $internal = self::PUBLIC_STATUS_MAP[$status] ?? null;
        if ($internal === null) {
            return $query;
        }

        return $query->where('status', $internal);
    }
}
