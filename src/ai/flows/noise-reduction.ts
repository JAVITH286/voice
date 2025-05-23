// This is an autogenerated file from Firebase Studio.

'use server';

/**
 * @fileOverview AI-powered noise reduction flow for audio recordings.
 *
 * - reduceNoise - A function to reduce background noise in audio.
 * - ReduceNoiseInput - The input type for the reduceNoise function.
 * - ReduceNoiseOutput - The return type for the reduceNoise function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReduceNoiseInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ReduceNoiseInput = z.infer<typeof ReduceNoiseInputSchema>;

const ReduceNoiseOutputSchema = z.object({
  noiseReducedAudioDataUri: z
    .string()
    .describe(
      'The noise-reduced audio recording as a data URI, with MIME type and Base64 encoding.'
    ),
});
export type ReduceNoiseOutput = z.infer<typeof ReduceNoiseOutputSchema>;

export async function reduceNoise(input: ReduceNoiseInput): Promise<ReduceNoiseOutput> {
  return reduceNoiseFlow(input);
}

const reduceNoisePrompt = ai.definePrompt({
  name: 'reduceNoisePrompt',
  input: {schema: ReduceNoiseInputSchema},
  output: {schema: ReduceNoiseOutputSchema},
  prompt: `You are an audio processing expert. Your task is to reduce background noise in the given audio recording.

  Input Audio: {{media url=audioDataUri}}

  Output: Please return the noise-reduced audio as a data URI.
  `,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const reduceNoiseFlow = ai.defineFlow(
  {
    name: 'reduceNoiseFlow',
    inputSchema: ReduceNoiseInputSchema,
    outputSchema: ReduceNoiseOutputSchema,
  },
  async input => {
    const {output} = await reduceNoisePrompt(input);
    return output!;
  }
);
