import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface FaceMatchResult {
  isMatch: boolean;
  confidence: number;
  analysisDetails: {
    idPhotoQuality: string;
    selfieQuality: string;
    facialFeatures: string;
    matchReasoning: string;
  };
  warnings: string[];
}

type ImageInput = 
  | { type: "url"; url: string }
  | { type: "base64"; data: string; mediaType: string };

export async function compareFaces(
  idFrontImage: ImageInput,
  selfieImage: ImageInput
): Promise<FaceMatchResult> {
  const systemPrompt = `You are an expert facial recognition analyst specializing in KYC (Know Your Customer) identity verification. Your task is to compare two images:
1. A government-issued ID photo (front of ID card, driver's license, passport, etc.)
2. A selfie/live photo of the person

Analyze both images and determine if they show the SAME person. Consider:
- Overall facial structure and proportions
- Key facial landmarks (eyes, nose, mouth, ears, jawline)
- Skin tone consistency
- Age-appropriate similarity (IDs may be a few years old)
- Lighting and angle differences that may affect appearance

Be strict but fair - real people may look slightly different due to:
- Aging (up to 10 years difference is acceptable)
- Different lighting conditions
- Makeup or facial hair changes
- Weight fluctuations
- Glasses/no glasses

You must respond ONLY with a valid JSON object in this exact format:
{
  "isMatch": true/false,
  "confidence": 0-100 (percentage),
  "idPhotoQuality": "excellent/good/fair/poor - brief description",
  "selfieQuality": "excellent/good/fair/poor - brief description", 
  "facialFeatures": "Description of matching/non-matching features",
  "matchReasoning": "Detailed explanation of why you believe this is/isn't the same person",
  "warnings": ["array of any concerns or issues found"]
}`;

  try {
    // Build image URL objects for OpenAI (supports both URL and base64)
    const buildImageUrl = (img: ImageInput) => {
      if (img.type === "url") {
        return { url: img.url, detail: "high" as const };
      } else {
        return { url: `data:${img.mediaType};base64,${img.data}`, detail: "high" as const };
      }
    };

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Please compare these two images and determine if they show the same person. Image 1 is the government ID photo, Image 2 is the selfie." },
            { type: "image_url", image_url: buildImageUrl(idFrontImage) },
            { type: "image_url", image_url: buildImageUrl(selfieImage) },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || "";
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      isMatch: Boolean(parsed.isMatch),
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
      analysisDetails: {
        idPhotoQuality: parsed.idPhotoQuality || "unknown",
        selfieQuality: parsed.selfieQuality || "unknown",
        facialFeatures: parsed.facialFeatures || "",
        matchReasoning: parsed.matchReasoning || "",
      },
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };
  } catch (error) {
    console.error("Face match error:", error);
    throw new Error(`Face matching failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function analyzeSingleFace(image: ImageInput, imageType: "id" | "selfie"): Promise<{
  hasFace: boolean;
  quality: string;
  issues: string[];
}> {
  const prompt = imageType === "id" 
    ? "Analyze this government ID photo. Is there a clear, visible face? Check for quality issues like blur, glare, or obstruction."
    : "Analyze this selfie photo. Is there a clear, visible face? Check if it appears to be a live photo (not a photo of a photo or screen).";

  // Build image URL for OpenAI
  const imageUrl = image.type === "url" 
    ? { url: image.url, detail: "high" as const }
    : { url: `data:${image.mediaType};base64,${image.data}`, detail: "high" as const };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { 
          role: "system", 
          content: `You are an image quality analyst for KYC verification. Respond ONLY with a valid JSON object:
{
  "hasFace": true/false,
  "quality": "excellent/good/fair/poor",
  "issues": ["array of any issues found, empty if none"]
}` 
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: imageUrl },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { hasFace: false, quality: "unknown", issues: ["Failed to analyze image"] };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      hasFace: Boolean(parsed.hasFace),
      quality: parsed.quality || "unknown",
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    };
  } catch (error) {
    console.error("Face analysis error:", error);
    return { hasFace: false, quality: "error", issues: ["Analysis failed"] };
  }
}
