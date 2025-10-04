'use server';
/**
 * @fileOverview Generates categories and sub-categories for a store using AI.
 *
 * - generateCategories: A function that creates a category structure based on a store's name and description.
 * - GenerateCategoriesInput: The input type for the function.
 * - GenerateCategoriesOutput: The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateCategoriesInputSchema = z.object({
  storeName: z.string().describe('The name of the store or company.'),
  description: z.string().describe('A brief description of what the store sells or does.'),
});
export type GenerateCategoriesInput = z.infer<typeof GenerateCategoriesInputSchema>;


const CategorySchema = z.object({
    name: z.string().describe('The name of the main category.'),
    subCategories: z.array(z.string()).min(2).max(10).describe('An array of 2 to 10 relevant sub-category names.'),
});

const GenerateCategoriesOutputSchema = z.object({
  categories: z
    .array(CategorySchema)
    .min(2)
    .max(10)
    .describe('An array of 2 to 10 main categories, each with its own sub-categories.'),
});
export type GenerateCategoriesOutput = z.infer<typeof GenerateCategoriesOutputSchema>;


// Exported wrapper function
export async function generateCategories(input: GenerateCategoriesInput): Promise<GenerateCategoriesOutput | undefined> {
  return generateCategoriesFlow(input);
}


const prompt = ai.definePrompt({
    name: 'generateCategoriesPrompt',
    input: { schema: GenerateCategoriesInputSchema },
    output: { schema: GenerateCategoriesOutputSchema },
    prompt: `
    You are an expert in business categorization and product management.
    Based on the following store name and description (in Persian), generate a structured list of relevant product categories and sub-categories in Persian.

    Store Name: "{{storeName}}"
    Description: "{{description}}"

    Provide up to 10 main categories. For each main category, provide up to 10 relevant sub-categories.
    The output should be directly usable for an e-commerce or inventory management system.
    `,
});


const generateCategoriesFlow = ai.defineFlow(
  {
    name: 'generateCategoriesFlow',
    inputSchema: GenerateCategoriesInputSchema,
    outputSchema: GenerateCategoriesOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error("Failed to generate categories.");
      }
      return output;
    } catch (error) {
      console.error("Error in generateCategoriesFlow:", error);
      // Return undefined or an empty structure on error to prevent app crash
      return undefined;
    }
  }
);
