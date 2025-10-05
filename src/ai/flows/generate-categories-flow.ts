'use server';
/**
 * @fileOverview Generates categories and sub-categories for a store using AI.
 *
 * - generateCategories: A function that creates categories based on store details.
 * - GenerateCategoriesInput: The input type for the function.
 * - GenerateCategoriesOutput: The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateCategoriesInputSchema = z.object({
  storeName: z.string().describe('The name of the store or company.'),
  description: z.string().describe('A brief description of what the store sells or does.'),
  parentCategoryPath: z.string().optional().describe('The full path of the parent category, e.g., "Tools > Power Tools". If not provided, main categories will be generated.'),
  existingSubCategories: z.array(z.string()).optional().describe('A list of sub-category names that already exist under the parent, to avoid duplicates.'),
});
export type GenerateCategoriesInput = z.infer<typeof GenerateCategoriesInputSchema>;

const GenerateCategoriesOutputSchema = z.object({
  categories: z.array(z.string()).describe('An array of generated category names in Persian.'),
});
export type GenerateCategoriesOutput = z.infer<typeof GenerateCategoriesOutputSchema>;


// Exported wrapper function
export async function generateCategories(input: GenerateCategoriesInput): Promise<GenerateCategoriesOutput | undefined> {
  return generateCategoriesFlow(input);
}

// Prompt for generating MAIN (parent) categories
const mainCategoriesPrompt = ai.definePrompt({
    name: 'generateMainCategoriesPrompt',
    input: { schema: z.object({ storeName: z.string(), description: z.string() }) },
    output: { schema: GenerateCategoriesOutputSchema },
    prompt: `
    You are an expert in business categorization and product management for the Iranian market.
    Based on the following store name and description (in Persian), generate a structured list of 5 to 10 relevant MAIN product categories in PERSIAN.
    These categories should be broad and general, suitable for a top-level menu in an e-commerce or inventory system.

    Store Name: "{{storeName}}"
    Description: "{{description}}"

    Example for a construction material store: "ابزارآلات", "مصالح ساختمانی", "رنگ و پوشش", "لوازم برقی", "تجهیزات ایمنی"
    `,
});

// Prompt for generating SUB-categories
const subCategoriesPrompt = ai.definePrompt({
    name: 'generateSubCategoriesPrompt',
    input: { schema: GenerateCategoriesInputSchema },
    output: { schema: GenerateCategoriesOutputSchema },
    prompt: `
    You are a highly specialized expert in product categorization for the Iranian market.
    Your task is to generate a list of 5 to 10 relevant and specific SUB-CATEGORIES in PERSIAN for a given parent category.

    **Context:**
    - Store Name: "{{storeName}}"
    - Store Description: "{{description}}"
    - Parent Category Path: "{{parentCategoryPath}}"

    **Crucial Instruction:**
    You MUST NOT generate any of the following sub-category names, as they already exist:
    {{#if existingSubCategories}}
    - {{#each existingSubCategories}}{{{this}}}{{/each}}
    {{else}}
    (No existing sub-categories to exclude)
    {{/if}}

    Generate only specific, relevant sub-categories that logically fit under the "{{parentCategoryPath}}". Do not suggest categories that are too broad or are peers of the parent.
    For example, if the path is "ابزار > ابزار برقی", valid sub-categories would be "دریل", "فرز", "پیچ‌گوشتی شارژی". Invalid ones would be "ابزار دستی" (a peer) or "ابزار" (too broad).
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
      let promptToUse;
      
      // Decide which prompt to use based on the input
      if (input.parentCategoryPath) {
        // We are generating sub-categories
        promptToUse = subCategoriesPrompt;
      } else {
        // We are generating main (parent) categories
        promptToUse = mainCategoriesPrompt;
      }

      const { output } = await promptToUse(input);
      
      if (!output) {
        throw new Error("Failed to generate categories from AI prompt.");
      }
      return output;
    } catch (error) {
      console.error("Error in generateCategoriesFlow:", error);
      // Return an empty structure on error to prevent app crash
      return { categories: [] };
    }
  }
);
