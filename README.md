Semester 6 Project

## Donation Map

SCRUM-50 adds authenticated donation map visualization at:

- Receiver: `/receiver/map`
- Donor: `/donatur/map`
- Admin: `/admin/map`

The frontend calls the Laravel proxy endpoint `/api/proxy/donations/map`, which forwards to the authenticated Laravel API route `GET /api/donations/map`. The response is a GeoJSON `FeatureCollection` filtered by `category_id`, `status`, `q`, optional `bbox`, and `limit`.

No new environment variables are required. Existing frontend proxy configuration still uses `LARAVEL_API_BASE` with the default `http://localhost:8000/api`.
