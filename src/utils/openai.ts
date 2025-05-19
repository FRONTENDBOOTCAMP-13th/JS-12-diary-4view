import OpenAI from 'openai';
import { getProfileValueByKey } from '../main';

const apiKey = import.meta.env.VITE_OPENAI_APIKEY;

const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
});

export const getImage = async (
  diaryText: string,
): Promise<string | null | undefined> => {
  try {
    const imagePrompt = await diaryToPrompt(diaryText);

    if (!imagePrompt) return null;

    console.log(`이미지 프롬프트 : ${imagePrompt}`);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
    });

    if (response && response.data && response.data.length > 0) {
      return response.data[0].url;
    } else {
      console.warn('이미지 응답이 비어 있습니다.');
      return null;
    }
  } catch (error) {
    console.error('이미지 생성 오류:', error);
    return null;
  }
};

const diaryToPrompt = async (diary: string) => {
  const pictureKeyword =
    getProfileValueByKey('pictureKeyword') || 'watercolor style';

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a prompt engineer that turns emotional diary entries into visual image prompts. Use the provided picture style keyword to adjust the style or mood. Output must be in English and include atmosphere, color, and subject details.`,
      },
      {
        role: 'user',
        content: `Diary entry: ${diary}\nPreferred picture style keyword: ${pictureKeyword}`,
      },
    ],
  });

  return response.choices[0].message.content;
};
