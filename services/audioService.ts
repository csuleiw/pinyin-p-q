import { GoogleGenAI, Modality } from "@google/genai";

// Singleton AudioContext
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    // Gemini 2.5 Flash TTS uses 24kHz
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

// Cache to store decoded buffers
const audioCache = new Map<string, AudioBuffer>();

// Mapping Pinyin to Chinese characters to ensure correct pronunciation
const PINYIN_TO_HANZI: Record<string, string> = {
  // P Group (Defaulting to 1st tone 'pō' for the initial 'p')
  'p': '坡',
  'pa': '趴',
  'po': '坡',
  'pi': '批',
  'pu': '扑',
  'pai': '拍',
  'pei': '胚',
  'pao': '抛',
  'pou': '剖',
  'pan': '攀',
  'pen': '喷',
  'pang': '乓',
  'peng': '烹',
  'ping': '乒',
  'pie': '瞥',
  'piao': '飘',

  // Q Group (Defaulting to 1st tone 'qī' for the initial 'q')
  'q': '七',
  'qi': '七',
  'qu': '区',
  'qia': '掐',
  'qie': '切', // qiē
  'qiao': '敲',
  'qiu': '秋',
  'qian': '千',
  'qin': '亲',
  'qiang': '枪',
  'qing': '青',
  'qun': '裙', // qún (2nd tone is more common/recognizable for this sound)
  'que': '缺',
  'quan': '圈',
};

/**
 * Decodes base64 string to Uint8Array
 */
const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Converts Raw PCM (Int16) to AudioBuffer
 * Gemini TTS returns raw PCM data (16-bit signed integer, 24kHz, mono) without headers.
 * We must manually convert this to an AudioBuffer.
 */
const pcmToAudioBuffer = (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): AudioBuffer => {
  // Ensure we have an even number of bytes for Int16Array
  let safeData = data;
  if (data.byteLength % 2 !== 0) {
    safeData = data.slice(0, data.byteLength - 1);
  }

  // Create Int16 view
  const dataInt16 = new Int16Array(safeData.buffer, safeData.byteOffset, safeData.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const playPinyinAudio = async (text: string): Promise<void> => {
  try {
    const ctx = getAudioContext();
    
    // Resume context if suspended
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Check cache first
    if (audioCache.has(text)) {
      playBuffer(ctx, audioCache.get(text)!);
      return;
    }

    // Determine pronunciation text (Chinese Character) or fallback to original
    const pronunciationText = PINYIN_TO_HANZI[text] || text;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: pronunciationText }] }], 
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      console.warn("No audio data returned from Gemini");
      return;
    }

    // 1. Decode Base64 string to bytes
    const rawBytes = decodeBase64(base64Audio);

    // 2. Convert Raw PCM bytes to AudioBuffer
    // Explicitly using 24000Hz as per Gemini specs for this model
    const audioBuffer = pcmToAudioBuffer(rawBytes, ctx, 24000, 1);
    
    // Cache it with the original text key so we reuse it for the same pinyin
    audioCache.set(text, audioBuffer);
    
    playBuffer(ctx, audioBuffer);

  } catch (error) {
    console.error("Error playing audio:", error);
  }
};

const playBuffer = (ctx: AudioContext, buffer: AudioBuffer) => {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
};

export const warmUpAudioContext = () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
};