<?php

namespace App\Observers;

use App\Models\Donation;
use Illuminate\Support\Facades\Cache;

/**
 * Flushes the map cache tag whenever a Donation is mutated.
 *
 * The map endpoint caches results for 60 seconds keyed by a hash of
 * the query parameters. Because individual keys cannot be enumerated
 * at flush-time we use the Cache "tags" feature when supported (Redis /
 * Memcached), or a simple pattern-compatible key prefix that allows us
 * to flush by a stored index when using the database driver.
 *
 * Strategy: maintain a "map_cache_version" integer in the cache.
 * Incrementing it effectively invalidates all map cache entries because
 * their keys now include the old version number.
 */
class DonationObserver
{
    /**
     * Bust the map cache after any status-changing save.
     */
    public function saved(Donation $donation): void
    {
        $this->flushMapCache();
    }

    public function deleted(Donation $donation): void
    {
        $this->flushMapCache();
    }

    private function flushMapCache(): void
    {
        // Increment the version counter. MapController reads this to build
        // its cache key, so old entries are simply never hit again.
        Cache::increment('map_cache_version');
    }
}
