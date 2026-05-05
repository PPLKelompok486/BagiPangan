<?php

namespace App\Notifications;

use App\Models\Claim;
use Illuminate\Notifications\Notification;

class ClaimRejected extends Notification
{
    public function __construct(private readonly Claim $claim)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $title = $this->claim->donation?->title ?? 'Donasi';

        return [
            'title' => 'Klaim Dibatalkan',
            'body' => "Klaim Anda untuk '{$title}' dibatalkan.",
            'action_url' => '/receiver/my-claims',
            'icon_type' => 'rejected',
            'meta' => [
                'donation_id' => $this->claim->donation_id,
                'claim_id' => $this->claim->id,
                'reason' => $this->claim->cancel_reason,
            ],
        ];
    }
}
