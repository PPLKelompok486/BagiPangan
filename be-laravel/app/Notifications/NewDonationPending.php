<?php

namespace App\Notifications;

use App\Models\Donation;
use Illuminate\Notifications\Notification;

class NewDonationPending extends Notification
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
        $donorName = $this->donation->user?->name ?? 'Donatur';

        return [
            'title' => 'Donasi Baru Menunggu Moderasi',
            'body' => "'{$this->donation->title}' dikirim oleh {$donorName}. Segera tinjau.",
            'action_url' => '/admin/donations',
            'icon_type' => 'new_donation',
            'meta' => [
                'donation_id' => $this->donation->id,
                'donor' => $donorName,
            ],
        ];
    }
}
