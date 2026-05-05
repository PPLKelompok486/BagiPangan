<?php

namespace App\Notifications;

use App\Models\Donation;
use Illuminate\Notifications\Notification;

class DonationApproved extends Notification
{
    public function __construct(private readonly Donation $donation)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Donasi Disetujui',
            'body' => "Donasi '{$this->donation->title}' Anda telah disetujui dan kini tampil di platform.",
            'action_url' => '/donatur/donations',
            'icon_type' => 'approved',
            'meta' => [
                'donation_id' => $this->donation->id,
                'title' => $this->donation->title,
            ],
        ];
    }
}
