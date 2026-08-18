import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { checkAiSortRateLimit } from "@/lib/ai-rate-limit";
import {
  buildWasteSortResult,
  buildWasteVisionPrompt,
  parseWasteVisionResponse,
  validateWasteImage,
  type WasteCategoryOption,
} from "@/lib/waste-sort";
import { createClient } from "@/utils/supabase/server";

const WASTE_VISION_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    image_quality: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["good", "poor"],
    },
    retake_reason: {
      type: SchemaType.STRING,
      nullable: true,
      description: "Alasan singkat untuk foto ulang jika kualitas foto buruk.",
    },
    unsupported_visible: { type: SchemaType.BOOLEAN },
    detections: {
      type: SchemaType.ARRAY,
      maxItems: 3,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category_id: { type: SchemaType.INTEGER },
          confidence: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["high", "medium", "low"],
          },
          issues: {
            type: SchemaType.ARRAY,
            maxItems: 4,
            items: {
              type: SchemaType.STRING,
              format: "enum",
              enum: ["dirty", "wet", "mixed", "contains_non_waste"],
            },
          },
        },
        required: ["category_id", "confidence", "issues"],
      },
    },
  },
  required: ["image_quality", "unsupported_visible", "detections"],
};

function hasValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (request.headers.get("host") ?? new URL(request.url).host);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(await cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ success: false, error: "Silakan login terlebih dahulu.", code: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!hasValidOrigin(request)) {
      return Response.json({ success: false, error: "Permintaan tidak valid.", code: "INVALID_ORIGIN" }, { status: 403 });
    }

    const rateLimit = await checkAiSortRateLimit(user.id);
    if (!rateLimit.allowed) {
      return Response.json(
        { success: false, error: "Terlalu banyak analisis. Silakan coba lagi nanti.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
      );
    }

    if (!process.env.GEMINI_API_KEY?.trim()) {
      return Response.json({ success: false, error: "Layanan analisis belum tersedia.", code: "AI_UNAVAILABLE" }, { status: 503 });
    }

    const formData = await request.formData().catch(() => null);
    const image = formData?.get("image");
    if (!(image instanceof File)) {
      return Response.json({ success: false, error: "Foto sampah wajib dipilih.", code: "IMAGE_REQUIRED" }, { status: 400 });
    }

    const imageValidation = await validateWasteImage(image);
    if (!imageValidation.ok) {
      const status = imageValidation.code === "TOO_LARGE" ? 413 : 415;
      return Response.json({ success: false, error: imageValidation.message, code: imageValidation.code }, { status });
    }

    const { data: categories, error: categoryError } = await supabase
      .from("waste_categories")
      .select("id, name, material_group")
      .order("name");
    if (categoryError || !categories?.length) {
      return Response.json({ success: false, error: "Daftar kategori sampah belum tersedia.", code: "CATEGORIES_UNAVAILABLE" }, { status: 503 });
    }

    const categoryOptions = categories as WasteCategoryOption[];
    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 700,
        responseMimeType: "application/json",
        responseSchema: WASTE_VISION_RESPONSE_SCHEMA,
      },
    });
    const generated = await model.generateContent([
      buildWasteVisionPrompt(categoryOptions),
      { inlineData: { data: base64, mimeType: image.type } },
    ]);
    const rawModelResponse = generated.response.text();
    if (!rawModelResponse.trim()) {
      throw new Error("Gemini returned an empty response");
    }
    const vision = parseWasteVisionResponse(rawModelResponse, (diagnostic) => {
      console.warn("[AI Sort] Model output normalized", diagnostic);
    });
    const result = buildWasteSortResult(vision, categoryOptions);

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error("[AI Sort] Analysis failed", {
      reason: error instanceof Error ? error.name : "unknown_error",
    });
    return Response.json({ success: false, error: "Foto belum berhasil dianalisis. Silakan coba lagi.", code: "ANALYSIS_FAILED" }, { status: 502 });
  }
}
