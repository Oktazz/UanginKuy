import { NextRequest } from "next/server";
import { successResponse } from "@/utils/api-response";

// DEMO: Mock AI response using Timeout
export async function POST(req: NextRequest) {
  try {
    // In Step 10, we will integrate Gemini API here.
    // For now, we simulate AI processing delay and return mock data.
    const body = await req.json();
    
    // Simulate 2 seconds delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Determine pseudo-random category for demo purposes
    const categories = [
      { category: "Plastik PET (Botol)", price: 4000 },
      { category: "Kardus Bekas", price: 2500 },
      { category: "Besi/Logam", price: 6000 }
    ];
    const mockEstimation = categories[Math.floor(Math.random() * categories.length)];

    return successResponse(mockEstimation, "AI Image analyzed successfully");
  } catch (error) {
    return successResponse({ category: "Campuran", price: 2000 }, "AI Fallback triggered");
  }
}
