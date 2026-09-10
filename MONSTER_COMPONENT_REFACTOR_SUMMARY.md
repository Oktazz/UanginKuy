# MONSTER_COMPONENT_REFACTOR_SUMMARY.md

Refactor 3 monster components → modular. Fokus: **memindahkan kode dulu, memperbaiki arsitektur kedua**. Zero perubahan perilaku. Tanpa Context/Redux ditambahkan.

## Summary

| Komponen | Sebelum | Sesudah |
|---|---|---|
| `addresses/page.tsx` | ~783 baris | ~87 baris (komposisi) |
| `RouteClient.tsx` | ~877 baris | ~321 baris (komposisi) |
| `AiChatWidget.tsx` | ~669 baris | ~160 baris (orchestrator) |

## Before vs After

### 1. Addresses
```
src/app/(nasabah)/profile/addresses/
Before: page.tsx (783 baris, 17 state)

After:
- page.tsx            ~87   — orchestrator
- useAddressBook.ts   ~290  — semua state/effect/handler
- AddressForm.tsx     ~310  — form presentasional (controlled)
- AddressCard.tsx     ~100  — kartu presentasional
- AddressList.tsx     ~90   — add-btn + loading + empty + grid
- DeleteAddressDialog.tsx ~76 — dialog presentasional
- types.ts            — Address + AddressFormState + EMPTY_ADDRESS_FORM
```

### 2. RouteClient
```
src/app/admin/routes/
Before: RouteClient.tsx (877 baris)

After:
- RouteClient.tsx     ~321  — komposisi + derived data
- RouteSummary.tsx    — 4 kartu
- PipelineStages.tsx  — section VRP pipeline
- TicketTable.tsx     ~238  — tab (internal) + 2 tabel + select assign
- IoTPanel.tsx        ~251  — register/list/warning IoT
- hooks/useIoTDevice.ts ~90 — state + handler perangkat
- helpers: formatLastPing pindah ke IoTPanel
```

### 3. AiChatWidget
```
components/ui/AiChatWidget.tsx (669)
→ components/ai-chat/
- AiChatWidget.tsx     ~160  — orchestrator (isOpen/input/scroll/history)
- ChatBubble.tsx       ~182  — UserBubble/BotBubble (memo) + TypingIndicator + markdown
- ChatMessageList.tsx  ~124  — welcome + suggested prompts + bubbles + scroll-btn
- ChatHeader.tsx       ~42   — header panel
- ChatInput.tsx        ~64   — textarea + tombol kirim
- hooks/useChatStream.ts ~176 — streaming SSE + rAF buffer + abort
- types.ts             — ChatMessage + EMPTY_SOURCES
```

## State Ownership Changes

- **Addresses**: semua state pindah ke `useAddressBook` (cohesive — logic halaman buku alamat). Timer debounce `geocodingTimer` state → `useRef` (tak pernah dirender; menghapus re-render tak perlu).
- **RouteClient**: `ticketTab` turun ke `TicketTable` (hanya dipakai di situ). State IoT (`deviceId`, `pendingAction`, `deviceToDelete`) pindah ke `useIoTDevice`. Parent simpan: `isGenerating`, `isDepotMissingDialogOpen`, `feedback`, `routeGenerated`.
- **AiChatWidget**: `messages` + `isLoading` + seluruh streaming pindah ke `useChatStream`. Input UI tetap di parent. `historyLoadedRef` tetap di parent (kohesi: sejarah chat).

Prinsip: state di "lowest common owner". Tidak ada Context baru.

## Logic Extraction

- Addresses: CRUD, optimistic set-primary + rollback, delete fade + rollback, geocoding debounce, submit → hook.
- RouteClient: IoT actions (`runDeviceAction`, register/assign/delete) → `useIoTDevice`. Ticket assign + generate tetap di parent (sharing `router`, `feedback`).
- AiChatWidget: **seluruh streaming dipindah verbatim** ke `useChatStream` — guard `isLoading`, AbortController, ReadableStream reader, SSE parse, rAF flush, final flush, cancel, error, `finally` reset.

## Performance Impact

- Streaming chat: perilaku rAF throttle **dipertahankan persis** (di-move, bukan ditulis ulang). `React.memo` bubble + `EMPTY_SOURCES` stabil tetap efektif.
- `geocodingTimer` state→ref: satu re-render lebih sedikit per debounce.
- Memisah `TicketTable`/`IoTPanel` juga memisahkan region re-render granular di React (tiap section hanya re-render saat props-nya berubah).

## Behavior Preserved (invariant)

- **Addresses**: endpoint sama (`/api/addresses`, `/api/addresses/[id]`), method POST/PATCH/DELETE, body sama, optimistic set-primary + rollback, delete fade-out 300ms + rollback, debounce 1500ms + fallback 3-query geocoding, validasi required, toast sukses/error, auto-primary saat pertama, `window.scrollTo` saat edit, semua class & struktur DOM.
- **RouteClient**: server actions sama, `router.refresh` timing sama, feedback banner sama, dialog depot & hapus device sama, `onlineDevices`/`readyCouriers`/`pipeline` derived sama, tab subtitle sama.
- **AiChatWidget**: GET history sekali (`historyLoadedRef`), POST payload `{message}`, AbortController, Enter/Shift+Enter, textarea auto-resize, tombol kirim disabled saat `!value.trim()` / loading, welcome + suggested prompts, scroll persistence, error jadi pesan ramah, ID tiap pesan via `genId`.

## Validation Results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ pass |
| `npx eslint` (files target) | ✅ pass |
| `npm run build` | ✅ pass |
| `npm test` | 2 file / 9 test gagal |

**Pre-existing failures (bukan regresi):**
- `test/app/page.test.tsx` (5) — `IntersectionObserver is not defined` di jsdom (env).
- `test/components/waste-sort/WasteSortClient.test.tsx` (4) — mock fetch/streaming tidak cocok dgn behavior asli.

**Regresi baru:** **NOL** (angka gagal identik dgn baseline sebelum refactor).

## Files Changed

**Baru:**
- `profile/addresses/`: `useAddressBook.ts`, `AddressCard.tsx`, `AddressList.tsx`, `AddressForm.tsx`, `DeleteAddressDialog.tsx`, `types.ts`
- `admin/routes/`: `RouteSummary.tsx`, `PipelineStages.tsx`, `TicketTable.tsx`, `IoTPanel.tsx`, `hooks/useIoTDevice.ts`
- `components/ai-chat/`: `AiChatWidget.tsx`, `ChatBubble.tsx`, `ChatMessageList.tsx`, `ChatHeader.tsx`, `ChatInput.tsx`, `hooks/useChatStream.ts`, `types.ts`

**Diubah:**
- `admin/routes/types.ts` (+ `Feedback` type)
- `src/app/(nasabah)/layout.tsx` (import AiChatWidget path baru)

**Dihapus:** `src/components/ui/AiChatWidget.tsx` (lama)

## Remaining Technical Debt

- `admin/routes/RouteMap.tsx` (~338 baris) belum dipecah — sengaja di luar scope (logika map + callbacks).
- `booking/page.tsx` (~450) dan `kurir/pickup/[id]/page.tsx` (~540) belum di-refactor — follow-up sesuai pola yang sama.
- `addresses/page.tsx` TETAP client component; konversi ke Server Component (fetch awal dari DB) ditunda — risiko > manfaat saat ini (state form/list saling terkait, optimistic UI).
- Lint error pre-existing (`any`, setState-in-effect) di `booking/page.tsx` + `addresses` legacy tidak disentuh — diluar scope refactor ini.
- `components/ui/` masih campur kebab/PascalCase naming — churn besar, nilai kecil, sengaja dilewatkan.