<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'action' => 'nullable|string|max:100',
            'entity_type' => 'nullable|string|max:200',
            'date_from' => 'nullable|date_format:Y-m-d',
            'date_to' => 'nullable|date_format:Y-m-d|after_or_equal:date_from',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $search = $validated['search'] ?? null;
        $action = $validated['action'] ?? null;
        $entityType = $validated['entity_type'] ?? null;
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $perPage = $validated['per_page'] ?? 20;

        $logs = ActivityLog::query()
            ->with(['actor:id,name,email'])
            ->when($action, fn ($query) => $query->where('action', $action))
            ->when($entityType, fn ($query) => $query->where('entity_type', $entityType))
            ->when($dateFrom, fn ($query) => $query->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn ($query) => $query->whereDate('created_at', '<=', $dateTo))
            ->when($search, function ($query) use ($search) {
                $needle = '%' . strtolower($search) . '%';
                $query->where(function ($inner) use ($needle) {
                    $inner->whereRaw('LOWER(action) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(entity_type) LIKE ?', [$needle])
                        ->orWhereRaw('CAST(entity_id AS CHAR) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(CAST(metadata AS CHAR)) LIKE ?', [$needle])
                        ->orWhereHas('actor', function ($actorQuery) use ($needle) {
                            $actorQuery->whereRaw('LOWER(name) LIKE ?', [$needle])
                                ->orWhereRaw('LOWER(email) LIKE ?', [$needle]);
                        });
                });
            })
            ->latest()
            ->paginate($perPage);

        $logs->setCollection(
            $logs->getCollection()->map(function (ActivityLog $log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'entity_type' => $log->entity_type,
                    'entity_id' => $log->entity_id,
                    'metadata' => $log->metadata,
                    'created_at' => $log->created_at,
                    'actor' => $log->actor ? [
                        'id' => $log->actor->id,
                        'name' => $log->actor->name,
                        'email' => $log->actor->email,
                    ] : null,
                ];
            })
        );

        return response()->json([
            'message' => 'Daftar aktivitas berhasil diambil',
            'data' => $logs,
        ]);
    }
}
