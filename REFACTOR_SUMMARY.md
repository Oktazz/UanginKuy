# REFACTOR_SUMMARY.md

Refactoring berdasarkan `CODE_AUDIT.md` (2026-09-09). Semua perubahan terverifikasi: `tsc --noEmit` ✅, `npm run build` ✅, `npm test` = baseline 9 kegagalan pre-existing (zero regresi).

## Security Improvements (Phase 1) 🔴

| Fix | Files |
|-----|-------|
| `requireAdmin()` di semua admin actions — prices, schedules, `assignCourier`, `generateOptimalRoutes` | `admin/prices/actions.ts`, `admin/schedules/actions.ts`, `admin/routes/actions.ts` |
| `/api/ors-route` kini ber-auth (session cookie), rate-limit Redis, cache geometry 1800s, hapus bocor `err.message` | `api/ors-route/route.ts` |
| Ganti cek auth service-role (no-op) → session cookie di approve/reject withdrawal | `api/admin/withdrawals/*/approve|reject/route.ts` |
| Hapus impor tak terpakai (`createAdminClient`, `redis`) yang menyembunyikan cek palsu | `api/admin/withdrawals/*/route.ts` |

**Before (approve route):**
```ts
const admin = createAdminClient();
const { data: { user } } = await admin.auth.getUser(); // selalu lolos — bukan cek sesi!
```
**After:**
```ts
const supabase = await createClient(await cookies());
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) return handleApiError(new Error("Unauthorized"), 401);
```

## Performance & Caching (Phase 2–3) 🟠

### Redis
- **Atomic rate limit**: helper `incrWindow()` (Lua `INCR`+`EXPIRE`) di `src/lib/redis.ts` — hapus pola racy `incr`+`expire` di 4 lokasi (`ai-rate-limit.ts`, `routes/actions.ts:96`, approve/reject routes).
- **Cache tool data AI** (`ai-tools.service.ts`): balance 15s, latest-ticket 60s, ticket-history 300s, waste-summary 300s, schedule 60s. Key: `ai-tool:{type}:{userId}`. Error payload tak dicache.
- **Cache ORS geometry** 1800s (hash koordinat sha256).
- **Cache chat history** 15s per user (`chat:history:{userId}`), error → tak dicache.

### React
- **AiChatWidget streaming**: throttle hingga 1 flush/frame via `requestAnimationFrame` + `useRef` buffer — hapus 200× re-render penuh saat stream ~15ms/chunk.
- **`React.memo`** pada `UserBubble` + `BotBubble` (+ `EMPTY_SOURCES` stabil agar memo efektif).
- **`CustomSelect`**: normalisasi options/selectedOption dibungkus `useMemo`.

**Before (streaming):**
```tsx
if (parsed.text) {
  accumulated += parsed.text;
  setMessages(prev => prev.map(m => m.id === botMsgId ? {...m, content: accumulated} : m)); // tiap chunk
}
```
**After:**
```tsx
if (parsed.text) {
  accumulated += parsed.text;
  scheduleStreamFlush(botMsgId, parsed.text); // 1 setState per frame
}
```

## Database Optimization (Phase 5) 🟡

- **Restrict `select('*')`**: `withdrawal.service.ts` (buang `request_key`, `provider_reference_no`, `beneficiary_name`, timestamps internal; pertahankan `account_number` utk masking UI), `ticket.service.ts` joins (`schedules(day_of_week, cut_off_time)` dst).
- **N+1 → RPC**: migration `supabase/migrations/20260909000000_bulk_update_tickets.sql` + `generateOptimalRoutes` panggil `admin.rpc("bulk_update_tickets")` dengan fallback loop jika RPC belum deploy.

## Cleanup & DRY (Phase 6) 🟢

- `src/types/api.ts` — `ApiResponse<T>` shared; hapus duplikat di `WithdrawalClient`, `WithdrawalAdminClient`, `WasteSortClient`.
- `src/utils/format.ts` — `formatIDR` shared; ganti `currencyFormatter` duplikat ×2.
- `src/utils/geocoding.ts` — `geocodeWithFallbacks()`; hapus duplikasi logika Nominatim 3-fallback di `addresses` + `booking`.
- Hapus **67 baris kode mati** (blok VRP ter-comment) di `RouteClient.tsx:383-449`.
- `ErrorAlert.tsx` — hapus `"use client"` (component presentasional).
- Perbaiki `as any` join di `ai-tools.service.ts` → tipe eksplisit + helper array-normalisasi.

## Files Changed (20 diubah, 6 baru)

**Diubah:**
`lib/redis.ts` · `lib/ai-rate-limit.ts` · `services/ai-tools.service.ts` · `services/ticket.service.ts` · `services/withdrawal.service.ts` · `api/ors-route/route.ts` · `api/ai/chat/route.ts` · `api/admin/withdrawals/[id]/approve|reject/route.ts` · `admin/prices/actions.ts` · `admin/schedules/actions.ts` · `admin/routes/actions.ts` · `admin/routes/RouteClient.tsx` · `admin/withdrawals/WithdrawalAdminClient.tsx` · `(nasabah)/booking/page.tsx` · `(nasabah)/profile/addresses/page.tsx` · `(nasabah)/withdrawal/WithdrawalClient.tsx` · `components/ui/AiChatWidget.tsx` · `components/ui/CustomSelect.tsx` · `components/ui/ErrorAlert.tsx` · `components/waste-sort/WasteSortClient.tsx`

**Baru:**
`src/types/api.ts` · `src/utils/format.ts` · `src/utils/geocoding.ts` · `supabase/migrations/20260909000000_bulk_update_tickets.sql` · `CODE_AUDIT.md` · `REFACTOR_SUMMARY.md`

## Remaining Technical Debt

### Fase 4 sebagian — monster components belum dipecah penuh
`addresses/page.tsx` (~800 baris), `RouteClient.tsx` (~880), `AiChatWidget.tsx` (~670) masih monolitik. Yang diekstrak kini hanya logika bersama (geocoding, memo bubble, dead code). Pecah penuh menjadi banyak file membutuhkan desain state-lifting yang hati-hati per file — **sengaja tidak dilakukan buta di sesi ini** demi aturan "jangan rusak fungsionalitas". Rekomendasi bertahap:
1. `addresses/page.tsx` → pisahkan `AddressListClient` + `DeleteAddressDialog` (state list/delete independen dari form).
2. `kurir/pickup/[id]/page.tsx` → `useIoTWeightSync` hook (loop polling 90s terisolasi).
3. `booking/page.tsx` → server component + `BookingClient.tsx` (hilangkan `fetch("/api")` round-trip).

### Lainnya
- **P4 geocoding proxy server-side** (`/api/geocode` + cache 24h + rate-limit) — masih client-side fetch ke Nominatim dari browser (melanggar ToS, tanpa rate control). Butuh route baru + cross-check key.
- **Lint error pre-existing** di `booking/page.tsx` & `addresses/page.tsx` (`any`, setState-dalam-effect, prefer-const) — sudah ada sebelum refactor, perlu clean-up terpisah.
- **RLS tak bisa diverifikasi dari repo** — audit dashboard Supabase untuk policy `waste_categories`, `schedules`, `tickets`, `withdrawals` berbasis role.
- Naming standardisasi (`PascalCase.tsx` untuk semua ui components) — churn besar, nilai kecil.
- `sizes` pada `<Image>` masih kurang di sebagian tempat.

## Catatan Deploy
Migration `supabase/migrations/20260909000000_bulk_update_tickets.sql` **harus diterapkan** (`supabase db push`) sebelum deploy agar N+1 benar-benar hilang; kode sudah punya fallback loop bila RPC belum ada.