'use server';
/**
 * @fileOverview A flow to synchronize lyrics with audio playback.
 *
 * - synchronizeLyricsWithAudio - A function that synchronizes lyrics with audio.
 * - SynchronizeLyricsWithAudioInput - The input type for the synchronizeLyricsWithAudio function.
 * - SynchronizeLyricsWithAudioOutput - The return type for the synchronizeLyricsWithAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SynchronizeLyricsWithAudioInputSchema = z.object({
  currentTime: z.number().describe('The current time of the audio playback in seconds.'),
  lyricsData: z
    .array(
      z.object({
        time: z.number(),
        text: z.string(),
      })
    )
    .describe('An array of lyric objects with time and text properties.'),
  currentLineIndex: z
    .number()
    .optional()
    .describe('The index of the currently active lyric line.'),
});
export type SynchronizeLyricsWithAudioInput = z.infer<
  typeof SynchronizeLyricsWithAudioInputSchema
>;

const SynchronizeLyricsWithAudioOutputSchema = z.object({
  currentLineIndex: z.number().describe('The index of the currently active lyric line.'),
});
export type SynchronizeLyricsWithAudioOutput = z.infer<
  typeof SynchronizeLyricsWithAudioOutputSchema
>;

export async function synchronizeLyricsWithAudio(
  input: SynchronizeLyricsWithAudioInput
): Promise<SynchronizeLyricsWithAudioOutput> {
  return synchronizeLyricsWithAudioFlow(input);
}

const synchronizeLyricsWithAudioFlow = ai.defineFlow(
  {
    name: 'synchronizeLyricsWithAudioFlow',
    inputSchema: SynchronizeLyricsWithAudioInputSchema,
    outputSchema: SynchronizeLyricsWithAudioOutputSchema,
  },
  async input => {
    let currentLineIndex = -1;
    for (let i = 0; i < input.lyricsData.length; i++) {
      if (input.lyricsData[i].time <= input.currentTime) {
        currentLineIndex = i;
      } else {
        break;
      }
    }

    return {currentLineIndex};
  }
);
