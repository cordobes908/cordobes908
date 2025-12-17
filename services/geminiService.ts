import { GoogleGenAI } from "@google/genai";
import { Character, ScriptLine } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Helper to convert numeric speed to descriptive text for the prompt
 */
const getSpeedDescription = (speed: number): string => {
  if (speed <= 0.7) return "speaking very slowly and deliberately";
  if (speed < 1.0) return "speaking slowly";
  if (speed === 1.0) return "speaking at a normal natural pace";
  if (speed <= 1.3) return "speaking quickly and enthusiastically";
  return "speaking very fast";
};

/**
 * Helper to convert accent ID to descriptive text
 */
const getAccentDescription = (accentId: string): string => {
  const map: Record<string, string> = {
    'mexican': 'Mexican Spanish accent',
    'argentine': 'Rioplatense Argentine Spanish accent',
    'spanish': 'Castilian Spanish accent (Spain)',
    'colombian': 'Colombian Spanish accent',
    'chilean': 'Chilean Spanish accent',
    'neutral': 'Neutral Latin American Spanish accent'
  };
  return map[accentId] || 'Neutral Spanish accent';
};

/**
 * Generates a multi-speaker audio podcast from a script.
 */
export const generatePodcastAudio = async (
  scriptLines: ScriptLine[],
  characters: Character[]
): Promise<string> => {
  if (!API_KEY) throw new Error("API Key is missing. Please check your environment configuration.");

  // 1. Identify active characters
  const activeCharacterIds = Array.from(new Set(scriptLines.map(l => l.characterId)));
  const activeCharacters = characters.filter(c => activeCharacterIds.includes(c.id));

  if (activeCharacters.length === 0) {
      throw new Error("El guion está vacío o no tiene personajes asignados.");
  }

  // 2. Handle Single Speaker Case
  if (activeCharacters.length === 1) {
    const char = activeCharacters[0];
    const accentDesc = getAccentDescription(char.accent);
    const speedDesc = getSpeedDescription(char.speed);
    
    // Improved prompt for single speaker style
    const prompt = `
    Voice Direction: You are a voice actor.
    Character Profile: ${char.name}.
    Style: ${accentDesc}, ${speedDesc}.
    
    Please read the following text acting out the character:
    
    ${scriptLines.map(l => l.text).join('\n')}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: char.voiceName }
            }
          }
        },
      });
      return extractAudio(response);
    } catch (e: any) {
       console.error("Single speaker generation failed", e);
       throw new Error(`Error generando audio (1 personaje): ${e.message}`);
    }
  }

  // 3. Handle Multi Speaker Case (>= 2 characters)
  // Mapping to exactly 2 slots (A/B)
  const SLOT_A = 'Speaker A';
  const SLOT_B = 'Speaker B';

  const voiceA = activeCharacters[0].voiceName;
  const distinctSecondChar = activeCharacters.find(c => c.voiceName !== voiceA) || activeCharacters[1] || activeCharacters[0];
  const voiceB = distinctSecondChar.voiceName;

  const charIdToSlot: Record<string, string> = {};
  activeCharacters.forEach((char, index) => {
      charIdToSlot[char.id] = (index % 2 === 0) ? SLOT_A : SLOT_B;
  });

  // Construct context instructions for the model
  // We tell the model to Adopt the persona, accent and speed for the generic "Speaker A" and "Speaker B" labels
  // based on who is currently mapped to them. 
  // Since multiple chars might map to Speaker A, this is tricky. 
  // However, usually users stick to 2 main chars. If alternating, we define the "Current Vibe" in the script.
  // A cleaner way for the prompt is to give stage directions inline if possible, 
  // but Gemini TTS takes the whole block.
  // We will define the PRIMARY characteristics of the voices assigned to the slots.

  const charA = activeCharacters[0];
  const charB = distinctSecondChar;

  const contextInstructions = `
    Context: A podcast conversation.
    
    ${SLOT_A} Acting Direction: ${getAccentDescription(charA.accent)}, ${getSpeedDescription(charA.speed)}.
    ${SLOT_B} Acting Direction: ${getAccentDescription(charB.accent)}, ${getSpeedDescription(charB.speed)}.
  `;

  const scriptContent = scriptLines.map(line => {
    const slot = charIdToSlot[line.characterId] || SLOT_A;
    // We can try to inject small parentheticals to guide tone if lines vary significantly, 
    // but global direction is safer for stability.
    return `${slot}: ${line.text}`;
  }).join('\n');

  const prompt = `
    ${contextInstructions}
    
    Script:
    ${scriptContent}
  `;

  const speakerVoiceConfigs = [
      { speaker: SLOT_A, voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceA } } },
      { speaker: SLOT_B, voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceB } } }
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: speakerVoiceConfigs
          }
        }
      },
    });
    return extractAudio(response);
  } catch (e: any) {
    console.error("Multi speaker generation failed", e);
    if (e.message.includes("speakerVoiceConfigs")) {
         throw new Error("Error interno de configuración de voces. Por favor intenta con menos voces únicas.");
    }
    throw new Error(`Error generando audio: ${e.message}`);
  }
};

/**
 * Helper to extract audio data from response
 */
function extractAudio(response: any): string {
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      console.error("Empty audio response", response);
      throw new Error("La respuesta de IA no contiene datos de audio.");
    }
    return base64Audio;
}

/**
 * Helper to decode audio for playback
 */
export const decodeAudioData = async (
  base64Data: string,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  
  const bufferLen = len % 2 === 0 ? len : len + 1;
  const bytes = new Uint8Array(bufferLen);
  
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const pcmData = new Int16Array(bytes.buffer);
  const channels = 1;
  const sampleRate = 24000;
  
  const audioBuffer = audioContext.createBuffer(channels, pcmData.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < pcmData.length; i++) {
    channelData[i] = pcmData[i] / 32768.0;
  }
  
  return audioBuffer;
};

export function encodePCM(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function createPCMBlob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encodePCM(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const getGeminiClient = () => ai;