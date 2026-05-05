<?php

namespace App\Notifications;

use App\Models\Claim;
use Illuminate\Notifications\Notification;

class ClaimCompleted extends Notification
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
            'title' => 'Bukti Penjemputan Diterima',
            'body' => "Penerima telah mengunggah bukti penjemputan untuk '{$title}'.",
            'action_url' => '/donatur/donations',
            'icon_type' => 'completed',
            'meta' => [
                'donation_id' => $this->claim->donation_id,
                'claim_id' => $this->claim->id,
                'proof_image_url' => $this->claim->proof_image_url,
            ],
        ];
    }
}
