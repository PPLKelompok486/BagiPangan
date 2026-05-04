<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MapController extends Controller
{
    private const DEFAULT_LIMIT = 500;
    private const MAX_LIMIT = 2000;

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['nullable', 'integer', 'exists:donation_categories,id'],
            'status' => ['nullable', Rule::in(['available', 'claimed', 'approved'])],
            'q' => ['nullable', 'string', 'max:120'],
            'bbox' => ['nullable', 'string'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:' . self::MAX_LIMIT],
        ]);

        $bbox = $this->parseBbox(Arr::get($validated, 'bbox'));
        $status = Arr::get($validated, 'status', 'available');
        $limit = (int) Arr::get($validated, 'limit', self::DEFAULT_LIMIT);

        $donations = Donation::query()
            ->with(['category:id,name', 'user:id,name,city'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereBetween('latitude', [-90, 90])
            ->whereBetween('longitude', [-180, 180])
            ->when($status === 'available', fn (Builder $query) => $query->where('status', 'approved'))
            ->when($status === 'approved', fn (Builder $query) => $query->where('status', 'approved'))
            ->when($status === 'claimed', fn (Builder $query) => $query->where('status', 'claimed'))
            ->when(Arr::get($validated, 'category_id'), fn (Builder $query, int $categoryId) => $query->where('category_id', $categoryId))
            ->when(Arr::get($validated, 'q'), function (Builder $query, string $keyword): void {
                $query->where(function (Builder $nested) use ($keyword): void {
                    $needle = '%' . strtolower($keyword) . '%';
                    $nested->whereRaw('LOWER(title) LIKE ?', [$needle])
                        ->orWhereRaw('LOWER(description) LIKE ?', [$needle]);
                });
            })
            ->when($bbox !== null, function (Builder $query) use ($bbox): void {
                [$minLng, $minLat, $maxLng, $maxLat] = $bbox;
                $query->whereBetween('longitude', [$minLng, $maxLng])
                    ->whereBetween('latitude', [$minLat, $maxLat]);
            })
            ->orderByDesc('available_until')
            ->limit($limit)
            ->get();

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $donations->map(fn (Donation $donation) => $this->toFeature($donation))->values(),
        ]);
    }

    public function detail(int $id): JsonResponse
    {
        $donation = Donation::with(['category:id,name', 'user:id,name,city'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->find($id);

        if (!$donation) {
            return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
        }

        return response()->json([
            'data' => $this->toFeature($donation)['properties'],
        ]);
    }

    /**
     * @return array<int, float>|null
     */
    private function parseBbox(?string $bbox): ?array
    {
        if ($bbox === null || trim($bbox) === '') {
            return null;
        }

        $parts = array_map('trim', explode(',', $bbox));
        if (count($parts) !== 4) {
            throw ValidationException::withMessages([
                'bbox' => 'Format bbox harus minLng,minLat,maxLng,maxLat.',
            ]);
        }

        foreach ($parts as $part) {
            if (!is_numeric($part)) {
                throw ValidationException::withMessages([
                    'bbox' => 'Nilai bbox harus berupa angka.',
                ]);
            }
        }

        $numbers = array_map(static fn (string $value): float => (float) $value, $parts);
        [$minLng, $minLat, $maxLng, $maxLat] = $numbers;

        $valid = $minLng >= -180 && $maxLng <= 180
            && $minLat >= -90 && $maxLat <= 90
            && $minLng <= $maxLng
            && $minLat <= $maxLat;

        if (!$valid) {
            throw ValidationException::withMessages([
                'bbox' => 'Nilai bbox tidak valid.',
            ]);
        }

        return $numbers;
    }

    /**
     * @return array<string, mixed>
     */
    private function toFeature(Donation $donation): array
    {
        return [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [
                    (float) $donation->longitude,
                    (float) $donation->latitude,
                ],
            ],
            'properties' => [
                'id' => $donation->id,
                'title' => $donation->title,
                'description' => $donation->description,
                'category_id' => $donation->category_id,
                'category' => $donation->category?->name ?? 'Tanpa kategori',
                'portion' => $donation->portion_count,
                'status' => $donation->status === 'approved' ? 'available' : $donation->status,
                'expired_at' => $donation->available_until?->toIso8601String(),
                'available_from' => $donation->available_from?->toIso8601String(),
                'thumbnail_url' => null,
                'donor_name' => $donation->user?->name ?? 'Donatur',
                'donor_city' => $donation->user?->city,
                'address' => $donation->address_detail ?: $donation->location_address,
                'detail_url' => '/receiver/donations/' . $donation->id,
            ],
        ];
    }
}
