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
  brandType: z.enum(['k-plus', 'miscellaneous']).optional().describe("The desired brand for material matching. 'k-plus' for K-Plus brand, 'miscellaneous' for non-K-Plus brands."),
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
    You are an expert assistant for a construction material supplier in Iran. Your task is to analyze the provided content and extract a list of materials, matching them against a list of existing products based on a specified brand preference.

    **CRITICAL INSTRUCTIONS:**

    1.  **Brand Preference is KEY:**
        {{#if brandType}}
        *   **Brand Type:** "{{brandType}}"
        *   **If 'k-plus':** You MUST ONLY match with products that have "کی پلاس" in their name.
        *   **If 'miscellaneous':** You MUST ONLY match with products that DO NOT have "کی پلاس" in their name.
        {{else}}
        *   **Brand Type:** Not specified. Find the best possible match regardless of brand.
        {{/if}}

    2.  **Context is Queen:**
        *   Before processing individual items, analyze the entire list to understand the project type (e.g., if you see "F47" and "U36", infer it's a flat ceiling project; if you see "T360", "T120", it's a grid ceiling). This context is vital.
        *   Know that K-Plus brand is relevant for flat ceilings, walls, and boxes, but NOT for grid ceilings or tiles.

    3.  **Intelligent Matching (within Brand context):**
        *   First, try to find an exact or very close match for each item in the 'existingProducts' list that fits the brand preference. Your matching must be very accurate.
        *   **Specific Rules for 'F47':** Any item like "سازه F47" or "پروفیل F47" or "اف ۴۷" or "سازه f47 ضخامت 5.5" MUST be matched to the product named "سازه F47".
        *   **Synonym Matching:** Be aware of common synonyms. For example, "پیچ پنل" or "پیچ کناف" MUST be matched to the product named "پیچ پنل" (which is usually a 2.5cm screw), NOT any other screw type.
        *   **Contextual Deduction:** If no direct match is found, use your contextual knowledge. For example, if the project is a flat ceiling and you see an item like "پانل 12.5 درجه یک", you must recognize "پانل" as a variant of "پنل".
            *   Since a flat ceiling requires panels, you MUST match this to the default panel product that fits the brand preference.
            *   For 'k-plus' brand, the default is "پنل RG کی پلاس".
            *   **MOST IMPORTANT:** For 'miscellaneous' brand or if no brand is specified, the default panel is ALWAYS "پنل RG باتیس". You must match any generic panel term to "پنل RG باتیس" in these cases.
        *   When a match is found (direct or deduced), use the existing product's data (id, name, unit). Set 'isNew' to false.

    4.  **Handling New Products:**
        *   Only if an item cannot be matched to an existing product, even with contextual deduction and respecting the brand preference, should you treat it as a new product.
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
