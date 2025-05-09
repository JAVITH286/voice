// 'use server';
/**
 * @fileOverview Converts speech to text using a noise-robust GenAI model.
 *
 * - speechToTextConversion - A function that handles the speech to text conversion process.
 * - SpeechToTextConversionInput - The input type for the speechToTextConversion function.
 * - SpeechToTextConversionOutput - The return type for the speechToTextConversion function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpeechToTextConversionInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SpeechToTextConversionInput = z.infer<typeof SpeechToTextConversionInputSchema>;

const SpeechToTextConversionOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio.'),
});
export type SpeechToTextConversionOutput = z.infer<typeof SpeechToTextConversionOutputSchema>;

export async function speechToTextConversion(input: SpeechToTextConversionInput): Promise<SpeechToTextConversionOutput> {
  return speechToTextConversionFlow(input);
}

const speechToTextConversionPrompt = ai.definePrompt({
  name: 'speechToTextConversionPrompt',
  input: {schema: SpeechToTextConversionInputSchema},
  output: {schema: SpeechToTextConversionOutputSchema},
  prompt: `Transcribe the following audio. Remove background noise, focus on speech, and output clear text:

Audio: {{media url=audioDataUri}}`,
});

const speechToTextConversionFlow = ai.defineFlow(
  {
    name: 'speechToTextConversionFlow',
    inputSchema: SpeechToTextConversionInputSchema,
    outputSchema: SpeechToTextConversionOutputSchema,
  },
  async input => {
    const {output} = await speechToTextConversionPrompt(input);
    return output!;
  }
);
