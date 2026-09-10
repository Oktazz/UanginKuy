# CODE_AUDIT.md

Audit tanggal: 2026-09-09. Scope: `src/` — Next.js 16 App Router, Supabase, Upstash Redis, React 19.

## Summary

- **Skor kualitas keseluruhan: 6.5 / 10**
- Arsitektur dasar sehat (route group `(auth)/(nasabah)/(kurir)/admin`, services layer, zod validations, RSC + client sub-component sudah dipakai).
- Masalah dominan: **keamanan API** (auth terlewat di beberapa route/action), **tanpa caching** di jalur panas (AI chat, ORS proxy, tool data), **monster components** 450–950 baris, duplikasi utilitas.

### Key Issues

| # | Jenis | Severity |
|---|-------|----------|
| 1 | `/api/ors-route` tanpa auth — proxy pakai API key berbayar | 🔴 HIGH |
| 2 | Admin actions (`prices`, `schedules`, `assignCourier`) tanpa cek role | 🔴 HIGH |
| 3 | Rate limiter `incr`+`expire` non-atomic → kunci yatim tanpa TTL | 🔴 HIGH |
| 4 | Route approve/reject withdrawal: auth cek pakai `service_role` client (no-op, misleading) | 🟠 HIGH* |
| 5 | `AiChatWidget` streaming: tiap chunk = re-render penuh daftar pesan | 🟠 HIGH |
| 6 | Tool data AI (balance/tiket/schedule) nol cache — tiap chat query Supabase | 🟠 HIGH |
| 7 | `RouteClient.tsx` 944 baris + 67 baris kode mati ter-comment | 🟡 MED |
| 8 | `addresses/page.tsx` 798 baris, 17 `useState`, full `"use client"` | 🟡 MED |
| 9 | Geocoding Nominatim duplikat 2 file + jalan client-side (bukan server proxy) | 🟡 MED |
| 10 | `select('*')` overfetch — bocor data finansial (nomor rekening) | 🟡 MED |
| 11 | N+1 bulk update tiket di `generateOptimalRoutes` | 🟡 MED |
| 12 | ORS route geometry tanpa cache (boros biaya external API) | 🟡 MED |
| 13 | Chat history (50 msg) load dari DB tiap panel dibuka | 🟡 MED |
| 14 | Duplikasi: `ApiResponse` ×3, `currencyFormatter` ×2, status-map ×4, format tanggal inline ≥10 tempat | 🟢 LOW |
| 15 | `as any` pada hasil join (`ai-tools.service`) mengenkripsi type safety | 🟢 LOW |
| 16 | `sizes` hilang pada `<Image>` | 🟢 LOW |

\* Bukan bypass aktual — `finalizeWithdrawal` (`withdrawal.service.ts:134`) tetap panggil `requireAdmin()`. Tapi cek di level route (`admin.auth.getUser()` pada service-role client) **selalu lolos** dan menyesatkan.

### Priority Fixes
1. Auth di semua `admin/*` actions (pakai `requireAdmin()` yang sudah ada).
2. Auth + rate limit + cache di `/api/ors-route`.
3. Atomic rate-limit Lua (`INCR`+`EXPIRE` via `redis.eval`).
4. Cache tool data AI (TTL 15–300s) + cache ORS (TTL 1800s).
5. Throttle streaming SSE ke 1 flush/frame + `React.memo` bubble.

---

## Detailed Findings

## Readability Issues

### R1. Monster components (violasi SoC)
- `src/app/admin/routes/RouteClient.tsx` — **944 baris**: fetch state + backend panggil + feedback + summary + map + tabel tiket + panel IoT + assignment.
- `src/app/(nasabah)/profile/addresses/page.tsx` — **798 baris, 17× `useState`**: CRUD + optimistic rollback + form + map + geocoding + dialog hapus + skeleton + empty state.
- `src/components/ui/AiChatWidget.tsx` — **633 baris**: stream logic SSE + parse + UI bubbles + history + tools drawer.

**Saran**: pecah per tanggung jawab. Contoh untuk addresses:

```tsx
// before: semua dalam satu file 798 baris
// after
src/app/(nasabah)/profile/addresses/
  page.tsx            // Server Component, fetch awal dari DB
  AddressListClient.tsx
  AddressFormClient.tsx
  DeleteAddressDialog.tsx
  useGeocoding.ts     // hook, dipakai juga booking
```

### R2. Penamaan inkonsisten
- File component campur konvensi di `src/components/ui/` (~50/50): `AdminChart.tsx` vs `auth-transition.tsx` vs `sign-in.tsx`.
- State banner sukses/error dinamai beda padahal sama: `Feedback` (`RouteClient.tsx:42`), `Notice` (`KnowledgeDocumentsClient.tsx:26`), `error`/`notice` string pair (`WithdrawalAdminClient.tsx:69`).
- Status map: `statusColors`+`statusLabel` (`tickets/page.tsx:177,184`), `statusStyles` (`WithdrawalClient.tsx:38`), `statusMeta` (`WithdrawalAdminClient.tsx:36`) — 4 nama untuk konsep identik.

**Saran**: satu konvensi — file component `PascalCase.tsx`; banner state → `{ type: "success" | "error"; message: string }` satu tipe (`src/types/feedback.ts`); status map satu per domain di `src/constants/`.

### R3. Fungsi nama ambigu
| Lokasi | Nama | Seharusnya |
|---|---|---|
| `RouteClient.tsx:49` | `formatLastPing` | `formatTimeSincePing` |
| `RouteClient.tsx:188` | `runDeviceAction` | `executeDeviceActionWithFeedback` |
| `WithdrawalAdminClient.tsx:198` | `processWithdrawal` | `handleWithdrawalAction` |
| `booking/page.tsx:138` | `submitBooking` | `createBooking` |

### R4. Kode mati & duplikasi geocoding
- `RouteClient.tsx:383-449` — **67 baris VRP pipeline ter-comment**, duplikat bagian aktif di `:844-910`. Hapus.
- Geocoding Nominatim 3-langkah fallback **identik** di `addresses/page.tsx:81-119` dan `booking/page.tsx:81-111`.

**Saran**: ekstrak bersama.

```ts
// src/utils/geocoding.ts
export async function geocodeWithNominatim(
  detail: string, district: string, city: string, province: string,
): Promise<{ lat: number; lng: number } | null> {
  const queries = [
    `${detail}, ${district}, ${city}, ${province}`,
    `${district}, ${city}, ${province}`,
    `${city}, ${province}`,
  ];
  for (const q of queries) {
    const res = await nominatimSearch(q); // query broaden
    if (res) return res;
  }
  return null;
}
```

### R5. DRY — utilitas duplikat
- `ApiResponse<T>` union didefinisikan lokal di `WithdrawalClient.tsx:34`, `WithdrawalAdminClient.tsx:23`, `WasteSortClient.tsx:23` → taruh di `src/types/api.ts`.
- `currencyFormatter` (`Intl.NumberFormat id-ID`) identik di `WithdrawalClient.tsx:22` dan `WithdrawalAdminClient.tsx:29` → `src/utils/format.ts`.
- `formatIndonesianDate` sudah ada di `src/utils/date.ts` tapi hanya 1 dari ~10 situs yang memakainya; sisanya `.toLocaleDateString("id-ID", …)` inline.

---

## Structure Issues

### S1. `"use client"` pada halaman penuh yang seharusnya Server Component
- `addresses/page.tsx` dan `booking/page.tsx`: halaman 450–800 baris full `"use client"`.

```tsx
// AFTER — page jadi server component, data dari DB langsung tanpa fetch("/api")
export default async function AddressesPage() {
  const { user } = await getAuthenticatedCustomer();       // server
  const addresses = await getAddresses(user.id);           // server query
  return <AddressBookClient addresses={addresses} />;      // client utk interaksi
}
```

Keuntungan: hilang round-trip `fetch("/api/addresses")`, bundle kecil, data awal non-CSR.

### S2. `"use client"` pada komponen presentasional tanpa alasan
- `ErrorAlert.tsx` — zero hooks/state/browser API, hanya render conditional. Hapus `"use client"` → file + konsumen salah satu client bundle.

### S3. Client fetch tak lewat abstraction
- Client components langsung `fetch("/api/…")`: `addresses/page.tsx:125`, `booking/page.tsx:117`, `WithdrawalClient.tsx:88`, `KnowledgeDocumentsClient.tsx:100`. Server memakai `services/`, client tidak.
- **Saran**: `src/lib/api-client.ts` — function typed per endpoint (`getAddresses()`, `getSchedules()`) supaya URL & parsing tipe tunggal.

### S4. Error handler utils terabaikan
- `src/utils/error-handler.ts` (`handleApiError`) ada tapi route handlers manual inline. Komponen `AiChatWidget` tangani error stream bikin sendiri. Pakai util yang ada.

---

## Performance Issues

### P1. Redirect: streaming chat men-trigger re-render tiap kata — `src/components/ui/AiChatWidget.tsx:352-358`
SSE server kirim chunk ~tiap 15ms (`route.ts:515`). Tiap chunk → `setMessages(prev => prev.map(…))` array baru → render ulang seluruh daftar pesan. 200 kata = 200 render dalam hitungan detik.

```tsx
// AFTER — akumulasi ref + flush 1×/frame lewat requestAnimationFrame
const pendingRef = useRef("");
const flush = useCallback((msgId: string) => {
  requestAnimationFrame(() => {
    const text = pendingRef.current;
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: text } : m));
  });
}, []);
```
Plus bungkus `UserBubble`/`BotBubble`/`TypingIndicator` dengan `React.memo`.

### P2. `CustomSelect` normalisasi O(n) tiap render — `src/components/ui/CustomSelect.tsx:51-61`
`normalizedOptions/groups/flatOptions/selectedOption` dihitung inline per render. Sudah bentuk di dalam form yang re-render per ketik.

```tsx
const normalizedGroups = useMemo(() => {
  const opts = options.map(o => typeof o === "string" ? { value: o, label: o } : o);
  return groups?.length ? groups : [{ label: "", options: opts }];
}, [options, groups]);
const selectedOption = useMemo(
  () => normalizedGroups.flatMap(g => g.options).find(o => o.value === value),
  [normalizedGroups, value],
);
```

### P3. `toLocaleDateString` dalam loop render — `booking/page.tsx:280-284`
Formatter Intl mahal dibangun; dipanggil 2×/item dalam `.map()`. Precompute saat build `availableDates`, atau cache formatter module-level.

### P4. Panggil API berbayar client-side tanpa proxy — Nominatim
Lihat P5 di bawah; geocoding 3 fetch sequential dari browser tiap input. Melanggar ToS Nominatim (butuh `Referer`/`User-Agent` server) + bebas abuse.

---

## Supabase Issues

### SB1. 🔴 Admin actions tanpa cek role — `admin/prices/actions.ts`, `admin/schedules/actions.ts`, `admin/routes/actions.ts:296`
`addCategory`, `updateCategory`, `deleteCategory`, `addSchedule`, `updateSchedule`, `deleteSchedule`, `assignCourier` pakai `createClient(await cookies())` **tanpa `getUser()`/`requireAdmin()`**. Kalau RLS belum set ketat, nasabah/kurir bisa edit harga & jadwal.

```ts
// AFTER
export async function addCategory(formData: FormData) {
  await requireAdmin();                       // menggantikan createClient utk cek
  const { supabase } = await getAuthenticatedProfile(); // atau requireAdmin return supabase
  // ...
}
```
`src/lib/auth/authorization.ts:26` sudah siap dipakai semua action.

### SB2. 🔴 `/api/ors-route` tanpa auth + bocor error intern — `src/app/api/ors-route/route.ts`
`proxy.ts:10-12` meng-exempt SEMUA `/api/*` dari middleware. Route ini proxy `ORS_API_KEY` berbayar ke siapa saja, tanpa auth, tanpa rate limit. Tambahkan:
```ts
const supabase = await createClient(await cookies());
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```
Dan `catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }) }` (jangan bocorkan `err.message`, baris 48).

### SB3. Route approve/reject: cek auth pakai service-role → no-op — `admin/withdrawals/[id]/approve|reject/route.ts:34`
`createAdminClient().auth.getUser()` dengan service-role **selalu sukses**; bukan cek sesi. Aman hanya karena `finalizeWithdrawal` (`withdrawal.service.ts:134`) panggil `requireAdmin()` internal. Ganti cek route dengan client cookie-based & CSRF yang sudah ada.

### SB4. 🟡 `select('*')` pada data sensitif — `withdrawal.service.ts:110`
`getMyWithdrawals` return semua kolom incl. `account_number`, `beneficiary_name`, `request_key`, `provider_reference_no` → **bocor ke frontend**.
```ts
.select("id, amount, fee_amount, net_amount, bank_name, status, created_at, updated_at, failure_reason")
```

### SB5. 🟡 N+1 bulk update — `admin/routes/actions.ts:440-452`
`Promise.all(updates.map(u => supabase.from("tickets").update(...).eq("id", u.id)))` = 1 round-trip per tiket. Buat RPC `bulk_update_tickets`:
```sql
-- supabase/migrations/<ts>_bulk_update_tickets.sql
create or replace function bulk_update_tickets(p_updates jsonb)
returns void language plpgsql security definer as $$
begin
  perform (select * from jsonb_populate_recordset(null::tickets, p_updates));
  update tickets t set
    courier_id = u.courier_id,
    route_sequence = u.route_sequence,
    status = u.status
  from jsonb_to_recordset(p_updates) as u(id uuid, courier_id uuid, route_sequence int, status text)
  where t.id = u.id;
end $$;
```

### SB6. 🟡 Overfetch join — `ticket.service.ts:81-94`
`select('*,\n schedules(*), …')` → colom tak terpakai serialized ke klien. Restrict kolom.

### SB7. 🟢 `as any` pada hasil join — `ai-tools.service.ts:78-85`
Definisikan tipe join eksplisit, hapus cache null.

---

## Redis Caching Issues

### RC1. 🔴 Rate limit non-atomic — `ai-rate-limit.ts:18-19` (pola sama di `routes/actions.ts:95`, `approve|reject/route.ts:43`)
`INCR` + conditional `EXPIRE` → bila `INCR` kembali >1 karena key sisa, `EXPIRE` tak pernah jalan → **kunci yatim tanpa TTL** (memory leak + lockout palsu).
```ts
// BEFORE
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, WINDOW_SECONDS);
// AFTER — atomic via Lua
const count = await redis.eval(
  `local c = redis.call('INCR', KEYS[1])
   if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
   return c`,
  [key], [WINDOW_SECONDS],
);
```

### RC2. 🔴 Tool data AI tanpa cache — `ai-tools.service.ts:13-33,37-87,131-191,195-221`
Tiap pesanan chat → 1–3 round-trip Supabase untuk balance/schedule/tiket yang jarang berubah. Cache per-user, TTL pendek:
```ts
const cacheKey = `ai-tool:balance:${userId}`;
const cached = await redis.get<number>(cacheKey).catch(() => null);
if (cached !== null) return cached;
const balance = await /* supabase */;
await redis.setex(cacheKey, 15, balance);   // 15s balance
```

### RC3. 🟡 ORS route tanpa cache — `app/api/ors-route/route.ts:16`
Koordinat yang sama → geometri identik; ORS berbayar & ada rate limit. Hash koordinat, cache 1800s:
```ts
const hash = createHash("sha256").update(JSON.stringify(coords)).digest("hex").slice(0, 16);
const key = `ors:route:${hash}`;
const hit = await redis.get(key);
if (hit) return NextResponse.json(hit);
// fetch …
await redis.setex(key, 1800, { geometry });
```

### RC4. 🟡 Chat history 50 msg tiap panel dibuka — `api/ai/chat/route.ts:231-289`
Append-only, boleh stale. Cache format hasil 15s per user: `chat:hist:${userId}`.

### RC5. 🟢 IoT key TTL 120s — `iot.service.ts:57`
TNV pendek; perpanjang ke 300–600s bila device ping kontinu agar jarang re-hit Supabase.

---

## Refactoring Suggestions

### High-value, low-risk (dikerjakan dulu)

**1. Auth untuk semua admin actions**
`routes/actions.ts:296 assignCourier`, `prices/actions.ts`, `schedules/actions.ts` — tambah `await requireAdmin()` baris pertama.

**2. Atomic rate limit**
Ekstrak `async function incrWindow(key, ttl)` in `src/lib/redis.ts` (pakai `redis.eval`), ganti semua pola `incr`+`expire`.

**3. Shared `ApiResponse` + formatter**
```ts
// src/types/api.ts
export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message?: string };
// src/utils/format.ts
export const formatIDR = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" });
```

**4. Hapus kode mati** `RouteClient.tsx:383-449`.

### Medium (1–2 sprint)
- Geocoding → `useGeocoding` hook + `api/geocode/route.ts` (proxied, cache 24h, rate-limit).
- Split `addresses/page.tsx`, `booking/page.tsx`, `kurir/pickup/[id]/page.tsx`.
- Cache tool data AI + ORS + chat history.
- Throttle SSE streaming + `React.memo` bubble.
- Restrict `select` kolom (withdrawal, ticket).

### Low
- Standarisasi naming file component → `PascalCase.tsx`.
- `formatIndonesianDate` dipakai seragam.
- Tambah `sizes` di `<Image>`.
- Hapus `"use client"` di `ErrorAlert.tsx`.

---

## Priority Action Plan

### High Priority (security + correctness)
1. 🔴 Auth di semua `admin/*` actions (prices, schedules, assignCourier) — `requireAdmin()`.
2. 🔴 `/api/ors-route`: auth + rate limit + jangan bocor `err.message`.
3. 🔴 Atomic rate-limit (`INCR`+`EXPIRE` Lua) di semua 4 situs.
4. 🟠 Route approve/reject: cek auth pakai cookie client, bukan service-role.
5. 🟠 Cache balance/schedule/ticket untuk tool AI (TTL 15–300s).

### Medium Priority
6. 🟡 Cache ORS geometry (hash coords, TTL 1800s) + cache chat history (15s).
7. 🟡 Restrict `select('*')` untuk withdrawal & ticket joins (hentikan bocor nomor rekening).
8. 🟡 RPC `bulk_update_tickets` untuk hapus N+1.
9. 🟡 Throttle streaming SSE + `React.memo` bubble (jank chat).
10. 🟡 Proxy geocoding server-side + cache.

### Low Priority
11. Split monster components (addresses, booking, kurir pickup, RouteClient).
12. De-dup utilitas: `ApiResponse`, `currencyFormatter`, status maps, `formatIndonesianDate`.
13. Hapus kode mati `RouteClient.tsx:383-449`.
14. Naming component konsisten `PascalCase`.
15. `sizes` pada `<Image>`, hapus `as any` join.

---

## Catatan Akhir
- **Kualitas type-safety baik** (zod di validasi input, `src/validations/*` lengkap dipakai API).
- **RLS tak bisa diaudit dari repo** — semua temuan "aman karena RLS" harus diverifikasi di Supabase dashboard. Prioritas: pastikan tabel `waste_categories`, `schedules`, `tickets`, `withdrawals` punya policy berbasis role, bukan default terbuka. Pola "trust RLS" terlihat berulang di route yang skip cek eksplisit — itu fragile.