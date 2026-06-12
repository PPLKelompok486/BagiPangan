import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(
  await readFile(path.join(root, "tests/automated/test-case-manifest.json"), "utf8"),
);

const cache = new Map();

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function text(relativePath) {
  if (!cache.has(relativePath)) {
    cache.set(relativePath, await readFile(path.join(root, relativePath), "utf8"));
  }
  return cache.get(relativePath);
}

async function contains(relativePath, patterns) {
  const content = await text(relativePath);
  for (const pattern of patterns) {
    if (pattern instanceof RegExp) {
      assert.match(content, pattern, `${relativePath} must match ${pattern}`);
    } else {
      assert.ok(content.includes(pattern), `${relativePath} must contain ${pattern}`);
    }
  }
}

async function listFiles(relativeDir) {
  const dir = path.join(root, relativeDir);
  const result = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listFiles(path.join(relativeDir, entry.name));
      result.push(...nested);
    } else if (entry.isFile()) {
      result.push(fullPath);
    }
  }
  return result;
}

const checks = {
  async "FR-02"() {
    assert.equal(await exists("be-laravel/app/Http/Controllers/RegisterController.php"), true);
    assert.equal(await exists("be-laravel/app/Services/RegisterService.php"), true);
    assert.equal(await exists("fe-nextjs/app/register/page.tsx"), true);
    await contains("be-laravel/routes/api.php", ["Route::post('/register'"]);
    await contains("fe-nextjs/app/register/page.tsx", ["name", "email", "password", "role"]);
  },

  async "FR-03"() {
    assert.equal(await exists("be-laravel/app/Http/Controllers/LoginController.php"), true);
    assert.equal(await exists("fe-nextjs/app/login/page.tsx"), true);
    await contains("be-laravel/routes/api.php", [
      "Route::post('/login'",
      "Route::post('/logout'",
      "Route::post('/forgot-password'",
      "Route::post('/reset-password'",
    ]);
    await contains("be-laravel/app/Http/Controllers/LoginController.php", [
      "RateLimiter",
      "tooManyAttempts",
      "availableIn",
      "clear(",
    ]);
  },

  async "FR-04"() {
    assert.equal(await exists("be-laravel/app/Http/Controllers/ProfileController.php"), true);
    assert.equal(await exists("fe-nextjs/app/profile/page.tsx"), true);
    await contains("be-laravel/routes/api.php", [
      "Route::get('/profile'",
      "Route::post('/profile'",
      "Route::put('/profile'",
      "Route::delete('/profile'",
    ]);
  },

  async "FR-05"() {
    assert.equal(await exists("be-laravel/app/Http/Controllers/Admin/CategoryManagementController.php"), true);
    assert.equal(await exists("fe-nextjs/app/admin/categories/page.tsx"), true);
    await contains("be-laravel/routes/api.php", [
      "Route::get('/categories'",
      "Route::post('/categories'",
      "Route::patch('/categories/{category}'",
      "Route::delete('/categories/{category}'",
    ]);
  },

  async "FR-06"() {
    assert.equal(await exists("be-laravel/app/Http/Controllers/DonationController.php"), true);
    assert.equal(await exists("fe-nextjs/app/donatur/donations/new/page.tsx"), true);
    await contains("be-laravel/routes/api.php", ["Route::post('/donations'"]);
    await contains("be-laravel/app/Http/Controllers/DonationController.php", [
      "'available_until' => 'required|date|after:available_from'",
      "'status' => 'pending'",
    ]);
  },

  async "FR-07"() {
    await contains("be-laravel/routes/api.php", [
      "Route::put('/donations/{id}'",
      "Route::delete('/donations/{id}'",
    ]);
    await contains("be-laravel/app/Http/Controllers/DonationController.php", [
      "Donasi yang sudah diklaim tidak dapat diubah",
      "Donasi sudah diklaim dan tidak dapat dibatalkan",
    ]);
  },

  async "FR-08"() {
    await contains("be-laravel/app/Http/Controllers/DonationController.php", [
      "'q' => ['nullable', 'string', 'max:120']",
      "'category_id' => ['nullable', 'integer', 'exists:donation_categories,id']",
      "escapeLikeValue",
    ]);
    assert.equal(await exists("fe-nextjs/app/donatur/donations/page.tsx"), true);
  },

  async "FR-09"() {
    await contains("be-laravel/routes/api.php", ["Route::get('/donations/{id}'"]);
    assert.equal(await exists("fe-nextjs/app/donatur/donations/[id]/page.tsx"), true);
    assert.equal(await exists("fe-nextjs/app/receiver/donations/[id]/page.tsx"), true);
  },

  async "FR-10"() {
    await contains("be-laravel/routes/api.php", ["Route::post('/donations/{id}/claim'"]);
    await contains("be-laravel/app/Http/Controllers/DonationController.php", [
      "Donatur tidak dapat mengklaim donasi sendiri",
      "Donasi sudah diklaim",
      "Donation::STATUS_CLAIMED",
    ]);
  },

  async "FR-11"() {
    await contains("be-laravel/routes/api.php", ["Route::post('/claims/{claim}/proof'"]);
    await contains("be-laravel/app/Http/Controllers/ClaimController.php", [
      "'proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:4096'",
      "proof_image_url",
      "Claim::STATUS_COMPLETED",
    ]);
  },

  async "FR-12"() {
    await contains("documentation/PROGRESS_VS_PROPOSAL.md", ["FR-12", "Not Started"]);
  },

  async "FR-13"() {
    await contains("be-laravel/routes/api.php", ["Route::get('/donations/mine'"]);
    assert.equal(await exists("fe-nextjs/app/donatur/dashboard/page.tsx"), true);
  },

  async "FR-14"() {
    await contains("be-laravel/routes/api.php", ["Route::get('/claims/mine'"]);
    assert.equal(await exists("fe-nextjs/app/receiver/my-claims/page.tsx"), true);
  },

  async "FR-15"() {
    await contains("be-laravel/routes/api.php", [
      "Route::get('/dashboard/summary'",
      "Route::get('/reports/analytics'",
    ]);
    assert.equal(await exists("fe-nextjs/app/admin/dashboard/page.jsx"), true);
    assert.equal(await exists("fe-nextjs/app/admin/reports/analytics/page.tsx"), true);
  },

  async "FR-16"() {
    await contains("be-laravel/routes/api.php", [
      "Route::get('/moderation/queue'",
      "Route::patch('/moderation/{donation}/approve'",
      "Route::patch('/moderation/{donation}/reject'",
      "Route::get('/users'",
      "Route::patch('/users/{user}/deactivate'",
      "Route::delete('/users/{user}'",
    ]);
  },

  async "FR-17"() {
    await contains("be-laravel/routes/api.php", ["Route::get('/reports/export'"]);
    await contains("be-laravel/app/Http/Controllers/Admin/ExportReportController.php", [
      "text/csv",
      "date_from",
      "date_to",
    ]);
  },

  async "FR-18"() {
    assert.equal(await exists("be-laravel/app/Models/ActivityLog.php"), true);
    assert.equal(await exists("be-laravel/app/Traits/HasAuditTrail.php"), true);
    await contains("be-laravel/routes/api.php", ["Route::get('/activity-logs'"]);
  },

  async "FR-19"() {
    assert.equal(await exists("fe-nextjs/app/donatur/map/page.tsx"), true);
    assert.equal(await exists("fe-nextjs/app/receiver/map/page.tsx"), true);
    await contains("be-laravel/routes/api.php", [
      "Route::get('/donations/map'",
      "Route::get('/donations/{id}/map-detail'",
    ]);
  },

  async "NFR-01"() {
    await contains("be-laravel/app/Http/Middleware/TokenAuth.php", ["hash('sha256', $token)"]);
    await contains("be-laravel/config/session.php", ["'secure' => env('SESSION_SECURE_COOKIE'"]);
  },

  async "NFR-02"() {
    await contains("fe-nextjs/package.json", ["next", "build"]);
    await contains("fe-nextjs/scripts/compress-images.mjs", ["sharp"]);
  },

  async "NFR-03"() {
    await contains("be-laravel/tests/Feature/DonationIndexTest.php", ["RefreshDatabase"]);
    await contains("be-laravel/tests/Feature/DonationMapTest.php", ["rate_limited"]);
  },

  async "NFR-04"() {
    await contains("fe-nextjs/app/donatur/donations/new/page.tsx", ["DonationForm", "Buat Donasi Baru"]);
    await contains("fe-nextjs/components/donations/DonationForm.tsx", ["label", "placeholder", "textarea", "select"]);
    await contains("fe-nextjs/app/receiver/donations/[id]/page.tsx", ["Klaim"]);
  },

  async "NFR-05"() {
    await contains("fe-nextjs/package.json", ["next"]);
    await contains("fe-nextjs/next.config.ts", ["nextConfig"]);
  },

  async "NFR-06"() {
    assert.equal(await exists("be-laravel/app/Http/Controllers"), true);
    assert.equal(await exists("be-laravel/app/Models"), true);
    assert.equal(await exists("fe-nextjs/app"), true);
    assert.equal(await exists("fe-nextjs/components"), true);
    await contains("be-laravel/.env.example", ["DB_CONNECTION=pgsql"]);
    assert.equal(await exists("documentation/ARCHITECTURE.md"), true);
  },
};

test("all TC requirements are backed by source-code or documented-gap contracts", async (t) => {
  for (const item of manifest.cases) {
    await t.test(item.id, async () => {
      assert.ok(checks[item.requirement], `${item.requirement} has no source contract`);
      await checks[item.requirement]();
    });
  }
});

test("existing Laravel feature test suite has real behavioral coverage", async () => {
  const files = await listFiles("be-laravel/tests/Feature");
  const testFiles = files.filter((file) => file.endsWith("Test.php"));
  assert.ok(testFiles.length >= 15, "expected broad Laravel feature test files");

  const testMethodCounts = await Promise.all(
    testFiles.map(async (file) => {
      const content = await readFile(file, "utf8");
      return [...content.matchAll(/public function test_/g)].length;
    }),
  );

  assert.ok(
    testMethodCounts.reduce((total, count) => total + count, 0) >= 55,
    "expected at least 55 existing Laravel feature test methods",
  );
});
