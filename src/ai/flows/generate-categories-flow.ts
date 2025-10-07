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
  existingCategoryNames: z.array(z.string()).optional().describe('A list of category names that already exist under the parent, to avoid duplicates.'),
});
export type GenerateCategoriesInput = z.infer<typeof GenerateCategoriesInputSchema>;


// Recursive schema for a category node which can have children of the same type
const CategoryNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
    name: z.string().describe("The name of the category in Persian."),
    children: z.array(CategoryNodeSchema).optional().describe("An array of sub-category nodes."),
}));

const GenerateCategoriesOutputSchema = z.object({
  categories: z.array(CategoryNodeSchema).describe('An array of generated category trees. Each object can have nested children.'),
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
    Your task is to generate a hierarchical list of relevant category names in PERSIAN.
    The structure must be a tree, with main categories and nested sub-categories.
    The hierarchy depth should be between 2 and 4 levels.

    **Context:**
    - Store Name: "{{storeName}}"
    - Store Description: "{{description}}"
    
    {{#if parentCategoryPath}}
    **Instruction for SUB-CATEGORIES:**
    - You MUST generate specific sub-categories that logically fit under the parent category path: "{{parentCategoryPath}}".
    - The generated categories should be more specific and detailed as they go deeper into the hierarchy.
    - You MUST NOT generate any of the following category names, as they already exist under this parent:
      {{#if existingCategoryNames}}
        {{#each existingCategoryNames}}
        - {{{this}}}
        {{/each}}
      {{else}}
        (No existing categories to exclude)
      {{/if}}
    - Example for parent path "ابزار > ابزار برقی": A valid response could be { "categories": [{ "name": "دریل", "children": [{ "name": "دریل چکشی" }, { "name": "دریل شارژی" }] }, { "name": "فرز" }] }.
    
    {{else}}
    **Instruction for MAIN CATEGORIES:**
    - You MUST generate broad, top-level product categories with at least 2 levels of nested sub-categories.
    - The main categories should be general, and sub-categories should become progressively more specific.
    - You MUST NOT generate any of the following main category names, as they already exist:
      {{#if existingCategoryNames}}
        {{#each existingCategoryNames}}
        - {{{this}}}
        {{/each}}
      {{else}}
        (No existing categories to exclude)
      {{/if}}
    - Example for a construction material store: 
      { 
        "categories": [
          { 
            "name": "ابزارآلات", 
            "children": [
              { "name": "ابزار برقی", "children": [{ "name": "دریل" }, { "name": "فرز" }] },
              { "name": "ابزار دستی", "children": [{ "name": "آچار" }, { "name": "انبر" }] }
            ] 
          },
          {
            "name": "مصالح ساختمانی",
            "children": [
              { "name": "سیمان و گچ" },
              { "name": "آجر و بلوک" }
            ]
          }
        ] 
      }
    {{/if}}

    Generate the category structure now. Ensure the output is a valid JSON that matches the required schema.
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
    
    if (!output || !output.categories) {
      // In case the AI returns an empty or invalid response, we ensure a valid structure.
      return { categories: [] };
    }
    return output;
  }
);
