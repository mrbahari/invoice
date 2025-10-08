'use server';
/**
 * @fileOverview Generates a list of 5 complete products based on a store's context.
 *
 * - generateFiveProducts - A function that creates a list of 5 full products.
 * - GenerateFiveProductsInput - The input type for the function.
 * - GenerateFiveProductsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateFiveProductsInputSchema = z.object({
  storeName: z.string().describe("The name of the user's store."),
  storeDescription: z.string().describe("A description of what the store sells."),
  categoryName: z.string().describe('The specific category to generate products for.'),
  existingProductNames: z.array(z.string()).describe('A list of product names that already exist in this category to avoid generating duplicates.'),
});
export type GenerateFiveProductsInput = z.infer<typeof GenerateFiveProductsInputSchema>;

const ProductSchema = z.object({
    name: z.string().describe('A professional, and marketable product name in Persian.'),
    description: z.string().describe('A compelling and professional product description in Persian (Farsi), around 2-3 sentences.'),
    price: z.number().describe('A reasonable suggested retail price in Iranian Rial (IRR) for this product, considering market value. Provide only a number.'),
});

const GenerateFiveProductsOutputSchema = z.object({
  products: z.array(ProductSchema).length(5).describe('An array of exactly 5 new, unique products.'),
});
export type GenerateFiveProductsOutput = z.infer<typeof GenerateFiveProductsOutputSchema>;

// This is the main flow that coordinates the generation
const generateFiveProductsFlow = ai.defineFlow(
  {
    name: 'generateFiveProductsFlow',
    inputSchema: GenerateFiveProductsInputSchema,
    outputSchema: GenerateFiveProductsOutputSchema,
  },
  async (input) => {

    const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `
            You are an expert product manager for the Iranian market.
            Based on the store name "{{storeName}}", its description "{{storeDescription}}", and the category "{{categoryName}}", generate a list of 5 diverse and relevant products.
            The product names and descriptions MUST be in professional Persian (Farsi).
            The price must be a reasonable estimate in Iranian Rials (IRR).
            CRITICAL: Do NOT generate any of the following product names as they already exist:
            {{#if existingProductNames}}
                {{#each existingProductNames}}
                - {{{this}}}
                {{/each}}
            {{else}}
                (No existing products to exclude)
            {{/if}}
        `,
        input,
        output: {
            schema: GenerateFiveProductsOutputSchema,
        }
    });

    if (!output) {
      throw new Error("Failed to generate product text details.");
    }
    
    return output;
  }
);


// Exported wrapper function
export async function generateFiveProducts(input: GenerateFiveProductsInput): Promise<GenerateFiveProductsOutput | null> {
  try {
      return await generateFiveProductsFlow(input);
  } catch (error) {
      console.error("Error in generateFiveProducts flow:", error);
      return null;
  }
}
