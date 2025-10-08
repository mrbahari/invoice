'use server';
/**
 * @fileOverview Extracts a list of materials from a file using AI.
 *
 * - extractMaterialsFromFile: A function that analyzes a file (image, pdf, text).
 * - ExtractMaterialsInput: The input type for the function.
 * - ExtractMaterialsOutput: The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Product, Category } from '@/lib/definitions';

const MaterialSchema = z.object({
    material: z.string().describe('The name of the construction material in Persian.'),
    quantity: z.number().describe('The quantity of the material.'),
    unit: z.string().describe('The unit of measurement for the material (e.g., "شاخه", "برگ", "عدد").'),
});

const ExtractMaterialsInputSchema = z.object({
  fileDataUri: z.string().describe("A file (image, PDF, text) encoded as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  existingProducts: z.array(z.custom<Product>()).describe("A list of existing products in the store for matching."),
  existingCategories: z.array(z.custom<Category>()).describe("A list of existing categories in the store."),
});
export type ExtractMaterialsInput = z.infer<typeof ExtractMaterialsInputSchema>;

const ExtractedProductSchema = z.object({
    isNew: z.boolean().describe("True if this is a new product that doesn't exist in the provided product list, false otherwise."),
    productId: z.string().describe("If isNew is false, this is the ID of the matched existing product. If isNew is true, this is a temporary placeholder name for the new product."),
    name: z.string().describe("The final name of the product. If matched, it's the name from the existing product list. If new, it's the name extracted from the file."),
    quantity: z.number().describe('The quantity of the material.'),
    unit: z.string().describe('The unit of measurement for the material (e.g., "شاخه", "برگ", "عدد").'),
});

const ExtractMaterialsOutputSchema = z.object({
  materials: z.array(ExtractedProductSchema).describe('An array of matched or new products extracted from the file.'),
});
export type ExtractMaterialsOutput = z.infer<typeof ExtractMaterialsOutputSchema>;


const extractMaterialsPrompt = ai.definePrompt({
    name: 'extractMaterialsPrompt',
    input: { schema: z.custom<ExtractMaterialsInput>() },
    output: { schema: ExtractMaterialsOutputSchema },
    prompt: `
    You are an expert assistant for a construction material supplier in Iran.
    Your task is to analyze the provided document (which could be an image of a handwritten list, a PDF, or a text file) and extract a list of all construction materials mentioned.
    For each material, you must identify its name, quantity, and unit of measurement.

    CRITICAL: You MUST compare each extracted material name with the list of 'existingProducts' provided.
    - If you find a close match (considering synonyms, typos, and common variations in Persian), you MUST use the existing product's data (id, name, unit). Set 'isNew' to false.
    - If there is NO reasonable match in the existing products, you MUST treat it as a new product. Set 'isNew' to true and use the extracted name as a temporary 'productId' and 'name'.

    The final response MUST be in PERSIAN.

    Existing Products for Matching:
    {{#if existingProducts}}
      {{#each existingProducts}}
      - id: {{id}}, name: "{{name}}", unit: "{{unit}}"
      {{/each}}
    {{else}}
      (No existing products)
    {{/if}}

    Analyze the following file content:
    {{media url=fileDataUri}}
    `,
});

const extractMaterialsFlow = ai.defineFlow(
  {
    name: 'extractMaterialsFlow',
    inputSchema: ExtractMaterialsInputSchema,
    outputSchema: ExtractMaterialsOutputSchema,
  },
  async (input) => {
    const { output } = await extractMaterialsPrompt(input);
    
    if (!output || !output.materials) {
      return { materials: [] };
    }
    return output;
  }
);


// Exported wrapper function
export async function extractMaterialsFromFile(input: ExtractMaterialsInput): Promise<ExtractMaterialsOutput> {
    try {
        const result = await extractMaterialsFlow(input);
        return result || { materials: [] };
    } catch (error) {
        console.error("Error in extractMaterialsFromFile flow:", error);
        // Return an empty list on failure to prevent crashes
        return { materials: [] };
    }
}
