<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'actor_user_id',
        'action',
        'entity_type',
        'entity_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    /**
     * Record a controller-level audit trail entry.
     *
     * Centralizes the array-shape so callers do not have to type the
     * `actor_user_id`, `action`, `entity_type`, `entity_id`, `metadata`
     * keys by hand. The `HasAuditTrail` trait covers model-level events;
     * use this helper for explicit controller actions.
     */
    public static function record(
        string $action,
        string $entityType,
        int|string|null $entityId = null,
        array $metadata = [],
        ?int $actorId = null
    ): self {
        return static::create([
            'actor_user_id' => $actorId ?? Auth::id(),
            'action'        => $action,
            'entity_type'   => $entityType,
            'entity_id'     => $entityId,
            'metadata'      => $metadata,
        ]);
    }
}
