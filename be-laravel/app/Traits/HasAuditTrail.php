<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

trait HasAuditTrail
{
    public static function bootHasAuditTrail()
    {
        static::created(function ($model) {
            $model->logActivity('created', null, $model->toArray());
        });

        static::updated(function ($model) {
            $old = array_intersect_key($model->getOriginal(), $model->getChanges());
            $new = $model->getChanges();
            
            // Don't log if only timestamps changed
            unset($new['updated_at']);
            if (empty($new)) return;

            $model->logActivity('updated', $old, $new);
        });

        static::deleted(function ($model) {
            $model->logActivity('deleted', $model->toArray(), null);
        });
    }

    protected function logActivity($action, $oldData = null, $newData = null)
    {
        ActivityLog::create([
            'actor_user_id' => Auth::id(),
            'action' => $action,
            'entity_type' => get_class($this),
            'entity_id' => $this->id,
            'metadata' => [
                'old' => $oldData,
                'new' => $newData,
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ],
        ]);
    }
}
