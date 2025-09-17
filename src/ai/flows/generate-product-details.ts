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

// Input Schema
export const GenerateProductDetailsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  feature: z.enum(['description', 'image', 'price']).describe('The specific feature to generate.'),
});
export type GenerateProductDetailsInput = z.infer<typeof GenerateProductDetailsInputSchema>;

// Output Schema
export const GenerateProductDetailsOutputSchema = z.object({
  description: z.string().optional().describe('A concise and appealing product description.'),
  imageUrl: z.string().optional().describe('A data URI for the generated product image.'),
  price: z.number().optional().describe('A suggested retail price for the product.'),
});
export type GenerateProductDetailsOutput = z.infer<typeof GenerateProductDetailsOutputSchema>;


const descriptionAndPricePrompt = ai.definePrompt({
    name: 'productDescriptionPricePrompt',
    input: { schema: z.object({ productName: z.string() }) },
    output: { schema: z.object({
        description: z.string().describe('A short, catchy, and professional product description in Persian (Farsi), max 2-3 sentences.'),
        price: z.number().describe('A reasonable suggested price in Iranian Rial (IRR) for this product, considering market value. Provide only a number.'),
    })},
    prompt: `Based on the product name "{{productName}}", generate a suitable description and a suggested price in Iranian Rial.`,
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
      const { output } = await descriptionAndPricePrompt({ productName: input.productName });
      if (!output) {
        throw new Error('Failed to generate description or price.');
      }
      return {
        description: input.feature === 'description' ? output.description : undefined,
        price: input.feature === 'price' ? output.price : undefined,
      };
    }
    
    if (input.feature === 'image') {
        const { media } = await ai.generate({
            model: 'googleai/imagen-4.0-fast-generate-001',
            prompt: `Generate a professional, high-quality product photo of a single '{{productName}}' on a clean, white background. The image should be well-lit and look like it belongs on an e-commerce website. No text, logos, or other objects.`,
        });

        if (!media.url) {
            throw new Error('Failed to generate image.');
        }

        return { imageUrl: media.url };
    }

    return {};
  }
);
