<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min(max((int) $request->query('per_page', 20), 1), 50);
        $notifications = Auth::user()
            ->notifications()
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'data' => $notifications->items(),
            'unread_count' => Auth::user()->unreadNotifications()->count(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function markRead(Request $request, string $id)
    {
        $notification = Auth::user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json(['message' => 'Notifikasi ditandai dibaca.']);
    }

    public function markAllRead(Request $request)
    {
        Auth::user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['message' => 'Semua notifikasi ditandai dibaca.']);
    }

    public function destroy(Request $request, string $id)
    {
        Auth::user()
            ->notifications()
            ->where('id', $id)
            ->delete();

        return response()->json(['message' => 'Notifikasi dihapus.']);
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'unread_count' => Auth::user()->unreadNotifications()->count(),
        ]);
    }
}
