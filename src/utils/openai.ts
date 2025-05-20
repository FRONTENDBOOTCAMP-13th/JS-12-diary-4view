import OpenAI from 'openai';
import { getProfileValueByKey } from '../main';

const apiKey = import.meta.env.VITE_OPENAI_APIKEY;

/**
 * OpenAI API 클라이언트 인스턴스를 생성합니다.
 * `dangerouslyAllowBrowser`는 브라우저에서 직접 호출을 허용합니다.
 */
const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
});

/**
 * 주어진 일기 텍스트를 기반으로 DALL·E 모델을 이용해 이미지를 생성합니다.
 *
 * @param {string} diaryText - 사용자가 작성한 감성적인 일기 텍스트
 * @returns {Promise<string | null>} base64 형식의 이미지 URI (data URL) 또는 실패 시 null
 */
export const fetchImage = async (): Promise<string | null> => {
  try {
    const diaryText = localStorage.getItem('diary') || '';
    const imagePrompt = await diaryToPrompt(diaryText);

    if (!imagePrompt) return null;

    console.log(`이미지 프롬프트 : ${imagePrompt}`);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json', // base64 형식으로 받기 위한 옵션
    });

    if (response && response.data && response.data.length > 0) {
      // base64 문자열을 Data URI 형식으로 반환
      return `data:image/png;base64,${response.data[0].b64_json}`;
    } else {
      console.warn('이미지 응답이 비어 있습니다.');
      return `/src/assets/images/sample.jpg`;
    }
  } catch (error) {
    console.error('이미지 생성 오류:', error);
    return `/src/assets/images/sample.jpg`;
  }
};

/**
 * 감성적인 일기 내용을 바탕으로 이미지 프롬프트를 생성합니다.
 *
 * @param {string} diary - 감성적인 일기 텍스트
 * @returns {Promise<string | null>} DALL·E 이미지 생성을 위한 영어 프롬프트
 *
 * @example
 * const prompt = await diaryToPrompt("오늘 고양이랑 햇빛을 즐겼다.");
 * // Returns: "A peaceful afternoon with a cat basking in sunlight, watercolor style, warm tones..."
 */
const diaryToPrompt = async (diary: string): Promise<string | null> => {
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
