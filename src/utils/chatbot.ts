// src/pages/diary.ts
const apiKey = import.meta.env.VITE_OPENAI_APIKEY;
const apiEndpoint = 'https://api.openai.com/v1/chat/completions';

document.addEventListener('DOMContentLoaded', () => {
  // 1) 기존 textarea#diary, button.save-button 선택
  const diaryText = document.querySelector<HTMLTextAreaElement>('#diary')!;
  const completeBtn =
    document.querySelector<HTMLButtonElement>('.save-button')!;

  // 2) AI 피드백 영역이 없으면 동적으로 생성해서 버튼 위에 삽입
  let aiFeedbackDiv = document.querySelector<HTMLDivElement>('#ai-feedback');
  if (!aiFeedbackDiv) {
    aiFeedbackDiv = document.createElement('div');
    aiFeedbackDiv.id = 'ai-feedback';
    aiFeedbackDiv.className =
      'w-full p-4 bg-gray-100 rounded-lg min-h-[4rem] text-gray-800 mb-4';
    aiFeedbackDiv.textContent = '';
    // 버튼 컨테이너 바로 위에 넣기
    completeBtn.parentElement!.insertAdjacentElement(
      'beforebegin',
      aiFeedbackDiv,
    );
  }

  // 3) OpenAI 호출 함수
  async function fetchAIResponse(prompt: string): Promise<string> {
    const res = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1024,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      }),
    });
    if (!res.ok) throw new Error(res.statusText);
    const { choices } = await res.json();
    return choices[0].message.content.trim();
  }

  // 4) 버튼 클릭 시 처리
  completeBtn.addEventListener('click', async () => {
    const diary = diaryText.value.trim();
    if (!diary) {
      aiFeedbackDiv!.textContent = '일기를 입력한 후 눌러주세요.';
      return;
    }

    aiFeedbackDiv!.textContent = 'AI가 코멘트를 작성하는 중입니다…';

    //프롬프트 입력
    const prompt = `아래 일기를 읽고 공감 문장이나, 간단한 조언 한 줄 등 답변해줘:\n"${diary}"`;

    try {
      const aiReply = await fetchAIResponse(prompt);
      aiFeedbackDiv!.textContent = aiReply;
    } catch (e) {
      console.error(e);
      aiFeedbackDiv!.textContent = 'AI 호출 중 오류가 발생했습니다.';
    }
  });
});
