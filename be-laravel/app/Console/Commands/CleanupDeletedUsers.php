<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Claim;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CleanupDeletedUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:cleanup-deleted-users';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete user accounts and all associated data after 7 days grace period';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoff = now()->subDays(7);
        $users = User::onlyTrashed()->where('deleted_at', '<=', $cutoff)->get();

        $this->info("Found {$users->count()} users to permanently delete.");

        foreach ($users as $user) {
            $this->info("Permanently deleting user: {$user->name} ({$user->email})");

            // 1. Delete associated claim proofs physically
            $claims = Claim::where('receiver_id', $user->id)->get();
            foreach ($claims as $claim) {
                if ($claim->proof_image_url) {
                    $proofPath = public_path($claim->proof_image_url);
                    if (File::exists($proofPath)) {
                        File::delete($proofPath);
                    }
                }
            }

            // 2. Delete avatar physically
            if ($user->avatar) {
                $avatarPath = public_path($user->avatar);
                if (File::exists($avatarPath)) {
                    File::delete($avatarPath);
                }
            }

            // Record audit log before the user is force deleted
            ActivityLog::record(
                'user.permanently_deleted',
                'user',
                $user->id,
                ['email' => $user->email, 'name' => $user->name]
            );

            // 3. Force delete the user (triggers database level cascade deletes)
            $user->forceDelete();
        }

        $this->info('Cleanup completed.');
    }
}
