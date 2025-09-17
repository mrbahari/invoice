
'use server';
/**
 * @fileOverview Generates product details using AI.
 *
 * - generateProductDetails - A function that generates a product description, image, and price.
 * - GenerateProductDetailsInput - The input type for the generateProductDetails function.
 * - GenerateProductDetailsOutput - The return type for the generateProductDetails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateProductDetailsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  categoryName: z.string().describe('The category of the product.'),
  feature: z.enum(['description', 'image', 'price']).describe('The specific feature to generate.'),
});
export type GenerateProductDetailsInput = z.infer<typeof GenerateProductDetailsInputSchema>;

const GenerateProductDetailsOutputSchema = z.object({
  description: z.string().optional().describe('A concise and appealing product description.'),
  imageUrl: z.string().optional().describe('A data URI for the generated product image.'),
  price: z.number().optional().describe('A suggested retail price for the product.'),
});
export type GenerateProductDetailsOutput = z.infer<typeof GenerateProductDetailsOutputSchema>;


const descriptionAndPricePrompt = ai.definePrompt({
    name: 'productDescriptionPricePrompt',
    input: { schema: z.object({ productName: z.string(), categoryName: z.string() }) },
    output: { schema: z.object({
        description: z.string().describe('A short, catchy, and professional product description in Persian (Farsi), max 2-3 sentences.'),
        price: z.number().describe('A reasonable suggested price in Iranian Rial (IRR) for this product, considering market value. Provide only a number.'),
    })},
    prompt: `برای یک محصول در دسته‌بندی «{{categoryName}}» با نام «{{productName}}»، یک توضیح کوتاه و حرفه‌ای به زبان فارسی و یک قیمت پیشنهادی معقول به ریال ایران ارائه بده. تاکید می‌شود که محصول مربوط به دسته‌بندی «{{categoryName}}» است.`,
});


// Exported wrapper function
export async function generateProductDetails(input: GenerateProductDetailsInput): Promise<GenerateProductDetailsOutput> {
  return generateProductDetailsFlow(input);
}


const generateProductDetailsFlow = ai.defineFlow(
  {
    name: 'generateProductDetailsFlow',
    inputSchema: GenerateProductDetailsInputSchema,
    outputSchema: GenerateProductDetailsOutputSchema,
  },
  async (input) => {
    
    if (input.feature === 'description' || input.feature === 'price') {
      const { output } = await descriptionAndPricePrompt({ productName: input.productName, categoryName: input.categoryName });
      if (!output) {
        throw new Error('Failed to generate description or price.');
      }
      return {
        description: input.feature === 'description' ? output.description : undefined,
        price: input.feature === 'price' ? output.price : undefined,
      };
    }
    
    if (input.feature === 'image') {
      try {
        const { media } = await ai.generate({
          model: 'googleai/imagen-4.0-fast-generate-001',
          prompt: `Generate a photorealistic, professional product photo of a "{{productName}}" which is a product in the "{{categoryName}}" category. The product should be on a clean, white background. Do not include any text, logos, or other objects in the image. The image should be suitable for an e-commerce website.`,
        });

        if (!media || !media.url) {
            throw new Error('AI image generation returned no media.');
        }
        
        return { imageUrl: media.url };

      } catch (error) {
        console.warn("AI image generation failed, falling back to placeholder.", error);
        // Fallback to picsum if Imagen fails (e.g., billing not enabled)
        const seed = encodeURIComponent(`${input.productName} ${input.categoryName} ${Math.random()}`);
        const imageUrl = `https://picsum.photos/seed/${seed}/400/300`;
        return { imageUrl };
      }
    }

    return {};
  }
);

