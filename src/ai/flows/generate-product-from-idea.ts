'use server';
/**
 * @fileOverview Generates a full product from a simple idea using AI.
 *
 * - generateProductFromIdea - A function that creates a full product structure.
 * - GenerateProductFromIdeaInput - The input type for the function.
 * - GenerateProductFromIdeaOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateProductFromIdeaInputSchema = z.object({
  productIdea: z.string().describe('The user\'s general idea for a product. Example: "a high quality cordless drill"'),
  storeId: z.string(),
  subCategoryId: z.string(),
  categoryName: z.string().describe('The name of the category for context.'),
});
export type GenerateProductFromIdeaInput = z.infer<typeof GenerateProductFromIdeaInputSchema>;

const GenerateProductFromIdeaOutputSchema = z.object({
  name: z.string().describe('A professional, and marketable product name in Persian.'),
  description: z.string().describe('A compelling and professional product description in Persian (Farsi), around 2-3 sentences.'),
  price: z.number().describe('A reasonable suggested retail price in Iranian Rial (IRR) for this product, considering market value. Provide only a number.'),
  imageUrl: z.string().describe('A URL for a generated, professional, photorealistic product image on a clean white background. No text, logos, or watermarks.'),
  storeId: z.string(),
  subCategoryId: z.string(),
});
export type GenerateProductFromIdeaOutput = z.infer<typeof GenerateProductFromIdeaOutputSchema>;

// This is the main flow that coordinates the generation
const generateProductFromIdeaFlow = ai.defineFlow(
  {
    name: 'generateProductFromIdeaFlow',
    inputSchema: GenerateProductFromIdeaInputSchema,
    outputSchema: GenerateProductFromIdeaOutputSchema,
  },
  async (input) => {
    // Step 1: Generate Text details (name, description, price)
    const detailsResult = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `Based on the product idea "{{productIdea}}" in the "{{categoryName}}" category, generate a professional product name, description, and price in Persian.`,
      input: input,
      output: {
        schema: z.object({
            name: z.string(),
            description: z.string(),
            price: z.number(),
        })
      },
    });
    
    const details = detailsResult.output();
    if (!details) {
      throw new Error("Failed to generate product text details.");
    }
    
    // Step 2: Generate Image
    const imageResult = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: `یک عکس محصول حرفه‌ای و فوتورئالیستی از: «${details.name}». تصویر باید روی پس‌زمینه سفید ساده و تمیز باشد. از اضافه کردن هرگونه متن، لوگو یا واترمارک خودداری شود.`,
    });

    const imageUrl = imageResult.media?.url;
    if (!imageUrl) {
        // Fallback to picsum if AI image generation fails
        const seed = encodeURIComponent(`${details.name} ${input.categoryName}`);
        return {
            ...details,
            imageUrl: `https://picsum.photos/seed/${seed}/400/300`,
            storeId: input.storeId,
            subCategoryId: input.subCategoryId,
        };
    }

    // Step 3: Combine and return
    return {
      name: details.name,
      description: details.description,
      price: Math.round(details.price),
      imageUrl: imageUrl,
      storeId: input.storeId,
      subCategoryId: input.subCategoryId,
    };
  }
);


// Exported wrapper function
export async function generateProductFromIdea(input: GenerateProductFromIdeaInput): Promise<GenerateProductFromIdeaOutput | null> {
  try {
      return await generateProductFromIdeaFlow(input);
  } catch (error) {
      console.error("Error in generateProductFromIdea flow:", error);
      return null;
  }
}
