import { z } from "zod";

export const MAX_WASTE_IMAGE_BYTES = 5 * 1024 * 1024;
export const WASTE_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const issueSchema = z.enum(["dirty", "wet", "mixed", "contains_non_waste"]);
const confidenceSchema = z.enum(["high", "medium", "low"]);

const wasteVisionResponseSchema = z.object({
  image_quality: z.enum(["good", "poor"]),
  retake_reason: z.string().trim().min(1).max(180).nullish(),
  unsupported_visible: z.boolean(),
  detections: z.array(z.object({
    category_id: z.number().int().positive(),
    confidence: confidenceSchema,
    issues: z.array(issueSchema).max(4),
  })).max(3),
}).strict();

export type WasteVisionResponse = {
  image_quality: "good" | "poor";
  retake_reason?: string;
  unsupported_visible: boolean;
  detections: Array<{
    category_id: number;
    confidence: "high" | "medium" | "low";
    issues: Array<z.infer<typeof issueSchema>>;
  }>;
};
export type WasteVisionDiagnostic = {
  kind: "invalid_json" | "schema_mismatch";
  paths: string[];
};
export type WasteSortStatus = "accepted" | "needs_separation" | "unsupported" | "uncertain";

export type WasteCategoryOption = {
  id: number;
  name: string;
  material_group: string;
};

export type WasteSortResult = {
  status: WasteSortStatus;
  needsRetake: boolean;
  retakeReason?: string;
  overallAdvice: string;
  items: Array<{
    categoryId: number;
    name: string;
    materialGroup: string;
    confidence: z.infer<typeof confidenceSchema>;
    issues: string[];
    preparationSteps: string[];
  }>;
};

const ISSUE_LABELS: Record<z.infer<typeof issueSchema>, string> = {
  dirty: "Masih terlihat kotor atau memiliki sisa isi.",
  wet: "Material terlihat basah dan sebaiknya dikeringkan.",
  mixed: "Material masih bercampur dengan jenis sampah lain.",
  contains_non_waste: "Foto juga memuat benda yang bukan sampah setoran.",
};

const GUIDANCE: Record<string, string[]> = {
  plastic: ["Kosongkan dan bilas kemasan.", "Keringkan, lalu pisahkan tutup atau label bila mudah dilepas."],
  paper: ["Pastikan kertas atau kardus bersih dan kering.", "Lipat atau ikat agar ringkas saat dijemput."],
  metal: ["Kosongkan dan bersihkan sisa isi.", "Pisahkan bagian nonlogam yang mudah dilepas."],
  glass: ["Bilas dan keringkan wadah kaca.", "Bungkus pecahan dengan aman dan beri tanda kepada kurir."],
};

const DEFAULT_GUIDANCE = [
  "Pisahkan dari sampah organik dan material lain.",
  "Pastikan material bersih dan kering sebelum dijemput.",
];

const FALLBACK_VISION_RESPONSE: WasteVisionResponse = {
  image_quality: "poor",
  unsupported_visible: false,
  detections: [],
  retake_reason: "Format hasil analisis tidak valid.",
};

const validIssues = new Set(issueSchema.options);
const validConfidences = new Set(confidenceSchema.options);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseWasteVisionResponse(
  raw: string,
  onDiagnostic?: (diagnostic: WasteVisionDiagnostic) => void,
): WasteVisionResponse {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let source: unknown;
  try {
    source = JSON.parse(cleaned);
  } catch {
    onDiagnostic?.({ kind: "invalid_json", paths: [] });
    return { ...FALLBACK_VISION_RESPONSE, detections: [] };
  }

  const strictResult = wasteVisionResponseSchema.safeParse(source);
  if (!strictResult.success) {
    onDiagnostic?.({
      kind: "schema_mismatch",
      paths: [...new Set(strictResult.error.issues.map((issue) => issue.path.join(".")).filter(Boolean))],
    });
  }

  if (!isRecord(source)) return { ...FALLBACK_VISION_RESPONSE, detections: [] };

  const detections: WasteVisionResponse["detections"] = [];
  const seenCategoryIds = new Set<number>();
  const rawDetections = Array.isArray(source.detections) ? source.detections.slice(0, 3) : [];

  for (const rawDetection of rawDetections) {
    if (!isRecord(rawDetection)) continue;
    const numericId = typeof rawDetection.category_id === "string"
      ? Number(rawDetection.category_id)
      : rawDetection.category_id;
    if (typeof numericId !== "number" || !Number.isInteger(numericId) || numericId <= 0 || seenCategoryIds.has(numericId)) {
      continue;
    }
    seenCategoryIds.add(numericId);

    const confidence = typeof rawDetection.confidence === "string"
      && validConfidences.has(rawDetection.confidence as z.infer<typeof confidenceSchema>)
      ? rawDetection.confidence as z.infer<typeof confidenceSchema>
      : "low";
    const issues = Array.isArray(rawDetection.issues)
      ? rawDetection.issues
          .filter((issue): issue is z.infer<typeof issueSchema> =>
            typeof issue === "string" && validIssues.has(issue as z.infer<typeof issueSchema>),
          )
          .slice(0, 4)
      : [];

    detections.push({ category_id: numericId, confidence, issues });
  }

  const retakeReason = typeof source.retake_reason === "string"
    ? source.retake_reason.trim().slice(0, 180)
    : "";

  return {
    image_quality: source.image_quality === "good" ? "good" : "poor",
    ...(retakeReason ? { retake_reason: retakeReason } : {}),
    unsupported_visible: source.unsupported_visible === true,
    detections,
  };
}

export function buildWasteSortResult(
  vision: WasteVisionResponse,
  categories: WasteCategoryOption[],
): WasteSortResult {
  if (vision.image_quality === "poor") {
    return {
      status: "uncertain",
      needsRetake: true,
      retakeReason: vision.retake_reason ?? "Foto belum cukup jelas. Gunakan cahaya yang baik dan dekatkan kamera.",
      overallAdvice: "Ambil foto ulang agar jenis sampah tidak salah dikenali.",
      items: [],
    };
  }

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const seen = new Set<number>();
  const items = vision.detections.flatMap((detection) => {
    const category = categoryMap.get(detection.category_id);
    if (!category || seen.has(category.id)) return [];
    seen.add(category.id);
    return [{
      categoryId: category.id,
      name: category.name,
      materialGroup: category.material_group,
      confidence: detection.confidence,
      issues: detection.issues.map((issue) => ISSUE_LABELS[issue]),
      preparationSteps: GUIDANCE[category.material_group] ?? DEFAULT_GUIDANCE,
    }];
  });

  if (items.length === 0) {
    return {
      status: vision.unsupported_visible ? "unsupported" : "uncertain",
      needsRetake: !vision.unsupported_visible,
      ...(vision.unsupported_visible
        ? {}
        : { retakeReason: "Kategori sampah belum dapat dikenali dengan yakin." }),
      overallAdvice: vision.unsupported_visible
        ? "Material pada foto belum termasuk kategori setoran yang tersedia."
        : "Coba foto satu hingga tiga jenis sampah dari jarak lebih dekat.",
      items: [],
    };
  }

  const hasMultipleMaterials = items.length > 1 || vision.detections.some((item) => item.issues.includes("mixed"));
  const allLowConfidence = items.every((item) => item.confidence === "low");

  return {
    status: allLowConfidence ? "uncertain" : hasMultipleMaterials ? "needs_separation" : "accepted",
    needsRetake: allLowConfidence,
    ...(allLowConfidence ? { retakeReason: "Hasil masih kurang meyakinkan. Foto ulang tiap jenis secara terpisah." } : {}),
    overallAdvice: allLowConfidence
      ? "Foto ulang tiap jenis sampah secara terpisah agar hasil lebih akurat."
      : hasMultipleMaterials
        ? "Pisahkan setiap kategori sebelum kurir datang agar penimbangan lebih cepat."
        : "Sampah ini dapat disiapkan mengikuti panduan sebelum dijemput.",
    items,
  };
}

function matchesSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      .every((byte, index) => bytes[index] === byte);
  }
  if (mimeType === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export async function validateWasteImage(file: File): Promise<
  | { ok: true }
  | { ok: false; code: "INVALID_TYPE" | "TOO_LARGE" | "INVALID_CONTENT"; message: string }
> {
  if (!WASTE_IMAGE_MIME_TYPES.includes(file.type as (typeof WASTE_IMAGE_MIME_TYPES)[number])) {
    return { ok: false, code: "INVALID_TYPE", message: "Gunakan foto JPG, PNG, atau WebP." };
  }
  if (file.size === 0 || file.size > MAX_WASTE_IMAGE_BYTES) {
    return { ok: false, code: "TOO_LARGE", message: "Ukuran foto harus di antara 1 byte dan 5 MB." };
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!matchesSignature(bytes, file.type)) {
    return { ok: false, code: "INVALID_CONTENT", message: "Isi berkas tidak cocok dengan format gambarnya." };
  }
  return { ok: true };
}

export function buildWasteVisionPrompt(categories: WasteCategoryOption[]): string {
  const categoryList = categories.map((category) =>
    `- id=${category.id}; name=${category.name}; group=${category.material_group}`,
  ).join("\n");

  return `Analisis foto sampah rumah tangga untuk membantu pengguna memilah sebelum pickup.
Gunakan HANYA category_id dari daftar server berikut:
${categoryList}

Aturan:
- Deteksi maksimal 3 kategori yang benar-benar terlihat.
- Jangan menaksir harga, berat, atau nilai uang.
- Jika foto buram, gelap, atau objek tidak terlihat jelas, set image_quality menjadi poor dan detections kosong.
- unsupported_visible bernilai true jika terlihat material sampah tetapi tidak cocok dengan kategori daftar.
- issues hanya boleh berisi: dirty, wet, mixed, contains_non_waste.
- Keluarkan JSON saja dengan bentuk:
{"image_quality":"good|poor","retake_reason":"opsional","unsupported_visible":false,"detections":[{"category_id":1,"confidence":"high|medium|low","issues":[]}]}`;
}
