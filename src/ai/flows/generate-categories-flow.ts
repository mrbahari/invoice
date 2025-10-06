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
  parentCategoryPath: z.string().optional().describe('The full path of the parent category, e.g., "ابزارآلات > ابزار برقی". If not provided, main categories will be generated.'),
  existingSubCategories: z.array(z.string()).optional().describe('A list of sub-category names that already exist under the parent, to avoid duplicates.'),
});
export type GenerateCategoriesInput = z.infer<typeof GenerateCategoriesInputSchema>;

const GenerateCategoriesOutputSchema = z.object({
  categories: z.array(z.string()).describe('An array of 5 to 10 generated category names in Persian.'),
});
export type GenerateCategoriesOutput = z.infer<typeof GenerateCategoriesOutputSchema>;


// Exported wrapper function
export async function generateCategories(input: GenerateCategoriesInput): Promise<GenerateCategoriesOutput> {
  const result = await generateCategoriesFlow(input);
  return result || { categories: [] };
}


const generateCategoriesPrompt = ai.definePrompt({
    name: 'generateCategoriesPrompt',
    input: { schema: GenerateCategoriesInputSchema },
    output: { schema: GenerateCategoriesOutputSchema },
    prompt: `
    You are an expert in business categorization and product management for the Iranian market.
    Your task is to generate a list of 5 to 10 relevant category names in PERSIAN.

    **Context:**
    - Store Name: "{{storeName}}"
    - Store Description: "{{description}}"
    
    {{#if parentCategoryPath}}
    **Instruction for SUB-CATEGORIES:**
    - You MUST generate specific sub-categories that logically fit under the parent category path: "{{parentCategoryPath}}".
    - You MUST NOT generate any of the following sub-category names, as they already exist:
      {{#if existingSubCategories}}
        {{#each existingSubCategories}}
        - {{{this}}}
        {{/each}}
      {{else}}
        (No existing sub-categories to exclude)
      {{/if}}
    - Example: If parent path is "ابزار > ابزار برقی", valid sub-categories are "دریل", "فرز", "پیچ‌گوشتی شارژی".
    
    {{else}}
    **Instruction for MAIN CATEGORIES:**
    - You MUST generate broad, top-level product categories.
    - Example for a construction material store: "ابزارآلات", "مصالح ساختمانی", "رنگ و پوشش", "لوازم برقی", "تجهیزات ایمنی".
    {{/if}}

    Generate the list of categories now.
    `,
});


const generateCategoriesFlow = ai.defineFlow(
  {
    name: 'generateCategoriesFlow',
    inputSchema: GenerateCategoriesInputSchema,
    outputSchema: GenerateCategoriesOutputSchema,
  },
  async (input) => {
    const { output } = await generateCategoriesPrompt(input);
    
    if (!output) {
      // In case the AI returns an empty response, we ensure a valid structure.
      return { categories: [] };
    }
    return output;
  }
);
