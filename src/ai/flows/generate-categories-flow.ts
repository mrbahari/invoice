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


// Define the recursive type explicitly
type CategoryNode = {
    name: string;
    children?: CategoryNode[];
};

// Use the explicit type with z.ZodType for the lazy schema
const CategoryNodeSchema: z.ZodType<CategoryNode> = z.lazy(() => z.object({
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
    You are an expert in creating comprehensive and deeply nested business categorization structures for the Iranian market.
    Your task is to generate a hierarchical list of relevant category names in PERSIAN.
    The structure must be a detailed tree with main categories and multiple levels of nested sub-categories.

    **Context:**
    - Store Name: "{{storeName}}"
    - Store Description: "{{description}}"
    
    {{#if parentCategoryPath}}
    // (Sub-category generation logic remains the same)
    **Instruction for SUB-CATEGORIES:**
    - You MUST generate specific sub-categories that logically fit under the parent category path: "{{parentCategoryPath}}".
    - The generated categories should be more specific and detailed as they go deeper into the hierarchy.
    - IMPORTANT: Your response MUST ONLY contain the NEW sub-categories for the given parent path. DO NOT include the parent categories themselves in the output. The output should be a flat list of new direct children for "{{parentCategoryPath}}".
    - You MUST NOT generate any of the following category names, as they already exist under this parent:
      {{#if existingCategoryNames}}
        {{#each existingCategoryNames}}
        - {{{this}}}
        {{/each}}
      {{else}}
        (No existing categories to exclude)
      {{/if}}
    - Example for parent path "ابزار > ابزار برقی": A valid response could be { "categories": [{ "name": "دریل" }, { "name": "فرز" }] }.
    
    {{else}}
    **CRITICAL Instruction for MAIN CATEGORIES:**
    - You MUST generate a comprehensive list of AT LEAST 10 main, top-level product categories.
    - Each main category MUST have a nested structure of sub-categories. The hierarchy should be 2 levels deep wherever logical.
    - The main categories should be general, and sub-categories must become progressively more specific.
    - You MUST NOT generate any of the following main category names, as they already exist:
      {{#if existingCategoryNames}}
        {{#each existingCategoryNames}}
        - {{{this}}}
        {{/each}}
      {{else}}
        (No existing categories to exclude)
      {{/if}}
    - **EXTREMELY IMPORTANT EXAMPLE** for a construction material store. Note the breadth and depth:
      {
        "categories": [
          {
            "name": "ابزارآلات",
            "children": [
              { "name": "ابزار برقی" },
              { "name": "ابزار دستی" },
              { "name": "ابزار بادی" }
            ]
          },
          {
            "name": "مصالح پایه",
            "children": [
              { "name": "سیمان و گچ" },
              { "name": "آجر و بلوک" }
            ]
          },
          {
            "name": "رنگ و پوشش",
            "children": [
              { "name": "رنگ ساختمانی" },
              { "name": "عایق و ضد زنگ" }
            ]
          }
        ]
      }
    {{/if}}

    Generate the category structure now. Ensure the output is a valid JSON that matches the required schema and STRICTLY follows the rules for depth and quantity.
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
