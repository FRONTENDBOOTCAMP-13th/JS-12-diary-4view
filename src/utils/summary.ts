import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_APIKEY;
const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
});

const GPT_MODEL = 'gpt-3.5-turbo';

export async function fetchSummary() {
  const diary = localStorage.getItem('diary');

  if (!diary) {
    console.warn('일기 내용 없음');
    return;
  }

  const summary = await getSummaryfromDiary(diary);
  console.log('일기 요약 :', summary);
  return summary;
}

async function getSummaryfromDiary(diary: string) {
  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      {
        role: 'system',
        content: `넌 감정에 휘둘리지 않는 담백한 작가야. 사용자의 일기를 3줄 이내로 요약해.
        - 반드시 "나"라는 1인칭 시점으로 요약할 것.
        - 과거형 문장으로 요약할 것.
        - 사건, 감정, 행동을 중심으로 사실을 요약할 것.
        - 과장 없이 사실 위주로 서술하되 감정이 드러난 표현은 허용됨.
        - 추측, 해석, 교훈은 절대 포함하지 말 것.
        - 불필요한 미사여구는 최대한 사용을 지양하고 간결하게 쓸 것.
        - 줄 수가 3줄을 넘지 않도록 할 것.
      `,
      },
      {
        role: 'user',
        content: `다음 일기를 요약해줘:\n${diary}`,
      },
    ],
  });

  const result = response.choices[0].message.content ?? '';

  return result;
}
