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

// OpenAI API 클라이언트 초기화
const openaiSong = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_APIKEY,
  dangerouslyAllowBrowser: true, // 브라우저 환경에서 API 키 사용 허용 (보안상 주의 필요)
});

// 일기 내용과 음악 장르를 기반으로 노래 추천을 받는 함수
export async function getSongRecommendation(): Promise<string | null> {
  try {
    // 로컬 스토리지에서 일기 내용 가져오기
    const diaryContent = localStorage.getItem('diary');
    if (!diaryContent) {
      console.error('일기 내용을 찾을 수 없습니다.');
      return null;
    }

    // 로컬 스토리지에서 사용자 프로필 정보 가져오기
    const profileStr = localStorage.getItem('profile');
    if (!profileStr) {
      console.error('사용자 프로필을 찾을 수 없습니다.');
      return null;
    }

    // 프로필에서 음악 장르(musicKeyword) 추출
    const profile = JSON.parse(profileStr);
    const musicGenre = profile.musicKeyword || '팝';

    // GPT에 보낼 프롬프트 구성
    const prompt = `형식: {가수이름} {노래제목} 으로 반환
일기내용: ${diaryContent}
요구: ${musicGenre} 중에 노래를 듣고 싶어. 하나만 추천해줄래?`;

    console.log('GPT에 보내는 프롬프트:', prompt);

    // OpenAI API 호출
    const completion = await openaiSong.chat.completions.create({
      model: 'gpt-3.5-turbo', // 모델 선택
      messages: [
        {
          role: 'system',
          content:
            '너는 음악 추천 전문가야. 형식에 맞게 가수 이름과 노래 제목만 정확히 반환해야 해.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7, // 창의성 수치
      max_tokens: 50, // 응답 길이 제한
    });

    // API 응답에서 추천 노래 정보 추출
    const recommendation = completion.choices[0]?.message.content?.trim();

    console.log('GPT 추천 노래:', recommendation);
    return recommendation;
  } catch (error) {
    console.error('노래 추천 중 오류 발생:', error);
    return null;
  }
}
