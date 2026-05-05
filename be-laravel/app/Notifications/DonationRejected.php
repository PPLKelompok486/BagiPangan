<?php

namespace App\Notifications;

use App\Models\Donation;
use Illuminate\Notifications\Notification;

class DonationRejected extends Notification
{
    public function __construct(
        private readonly Donation $donation,
        private readonly string $reason,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Donasi Ditolak',
            'body' => "Donasi '{$this->donation->title}' ditolak. Alasan: {$this->reason}.",
            'action_url' => '/donatur/donations',
            'icon_type' => 'rejected',
            'meta' => [
                'donation_id' => $this->donation->id,
                'reason' => $this->reason,
            ],
        ];
    }
}
