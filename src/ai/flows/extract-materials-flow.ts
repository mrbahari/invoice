'use server';
/**
 * @fileOverview Extracts a list of materials from a file or text using AI.
 *
 * - extractMaterialsFromFile: A function that analyzes a file (image, pdf, text) or a string.
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
  fileDataUri: z.string().optional().describe("A file (image, PDF, text) encoded as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  textInput: z.string().optional().describe("A string of text containing the list of materials."),
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
    You are an expert assistant for a construction material supplier in Iran. Your task is to analyze the provided content and extract a list of materials.

    **CRITICAL INSTRUCTIONS:**

    1.  **Analyze Context First:** Before processing individual items, analyze the entire list to understand the type of construction project (e.g., if you see "F47" and "U36", you can infer it's a flat ceiling project). This context is key.

    2.  **Deduce Necessary Materials:** Based on the project type, you know certain materials *must* exist. For a flat ceiling project, "پنل" (panel) and "نبشی" (L-profile) are essential.

    3.  **Intelligent Matching:**
        *   First, try to find an exact or very close match for each item in the 'existingProducts' list. Your matching should be very accurate and consider common synonyms and typos in Persian (e.g., "پیچ کناف" should match "پیچ پنل").
        *   **If no direct match is found, use your contextual knowledge.** For example, if the project is a flat ceiling and you see an item like "پانل 12.5 درجه یک", you must recognize "پانل" as a variant of "پنل". Since you know a panel is required, you should match this to the default existing panel product (e.g., "پنل RG باتیس").
        *   When a match is found (either direct or through deduction), you MUST use the existing product's data (id, name, unit). Set 'isNew' to false.

    4.  **Handling New Products:**
        *   Only if an item cannot be matched to an existing product, even with contextual deduction, should you treat it as a new product.
        *   For new products, set 'isNew' to true, and use the extracted name as a temporary 'productId' and 'name'.

    5.  **Output:** The final response MUST be in PERSIAN.

    **Data for Analysis:**

    Existing Products for Matching:
    {{#if existingProducts}}
      {{#each existingProducts}}
      - id: {{id}}, name: "{{name}}", unit: "{{unit}}"
      {{/each}}
    {{else}}
      (No existing products)
    {{/if}}

    Analyze the following content:
    {{#if textInput}}
    Text content:
    ---
    {{textInput}}
    ---
    {{else}}
    File content:
    {{media url=fileDataUri}}
    {{/if}}
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
        if (!input.fileDataUri && !input.textInput) {
            throw new Error("Either fileDataUri or textInput must be provided.");
        }
        const result = await extractMaterialsFlow(input);
        return result || { materials: [] };
    } catch (error) {
        console.error("Error in extractMaterialsFromFile flow:", error);
        // Return an empty list on failure to prevent crashes
        return { materials: [] };
    }
}
