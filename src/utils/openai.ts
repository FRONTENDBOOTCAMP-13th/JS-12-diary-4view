import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_APIKEY;

const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
});

export const getImage = async (diaryText: string) => {
  try {
    const pictureKeyword = localStorage.getItem('pictureKeyword') || '';
    const prompt = `${diaryText} 이 내용을 바탕으로 한 ${pictureKeyword} 스타일의 그림을 그려줘 조금 귀여운 느낌이 되었으면 좋겠어`;

    const response = await openai.images.generate({
      model: 'dall-e-3', // 또는 "dall-e-2"
      prompt: prompt,
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
