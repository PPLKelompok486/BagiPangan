<?php

namespace App\Notifications;

use App\Models\Claim;
use App\Models\Donation;
use Illuminate\Notifications\Notification;

class DonationClaimed extends Notification
{
    public function __construct(
        private readonly Donation $donation,
        private readonly Claim $claim,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $receiverName = $this->claim->receiver?->name ?? 'Penerima';

        return [
            'title' => 'Donasi Diklaim',
            'body' => "Donasi '{$this->donation->title}' baru saja diklaim oleh {$receiverName}.",
            'action_url' => '/donatur/donations',
            'icon_type' => 'claimed',
            'meta' => [
                'donation_id' => $this->donation->id,
                'claim_id' => $this->claim->id,
                'receiver' => $receiverName,
            ],
        ];
    }
}
