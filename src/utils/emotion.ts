import Chart from 'chart.js/auto';

const apiKey = import.meta.env.VITE_OPENAI_APIKEY;
const apiEndpoint = 'https://api.openai.com/v1/chat/completions';

document.addEventListener('DOMContentLoaded', () => {
  const diaryInput = document.getElementById(
    'diary-input',
  ) as HTMLTextAreaElement;
  const analyzeBtn = document.getElementById(
    'analyze-btn',
  ) as HTMLButtonElement;
  const loadingDiv = document.getElementById('loading') as HTMLDivElement;
  const resultDiv = document.getElementById('result') as HTMLDivElement;
  const chartCanvas = document.getElementById(
    'emotion-chart',
  ) as HTMLCanvasElement;
  const keywordsDiv = document.getElementById('keywords') as HTMLDivElement;
  const summaryP = document.getElementById('summary') as HTMLParagraphElement;

  let emotionChart: Chart;

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
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) throw new Error(res.statusText);
    const { choices } = await res.json();
    return choices[0].message.content.trim();
  }

  analyzeBtn.addEventListener('click', async () => {
    const diary = diaryInput.value.trim();
    if (!diary) {
      alert('일기를 입력한 후 분석해주세요.');
      return;
    }

    loadingDiv.hidden = false;
    resultDiv.hidden = true;
    keywordsDiv.innerHTML = '';
    summaryP.textContent = '';

    const prompt = `
아래 형식의 JSON 객체 하나만 응답해주세요. 다른 텍스트를 섞지 마세요. 키워드는 한글로 답하세요.

{
  "emotion": {
    "happiness": 0,
    "sadness": 0,
    "anger": 0,
    "excitement": 0,
    "anxiety": 0,
    "gratitude": 0,
    "boredom": 0,
    "tension": 0,
    "calmness": 0
  },
  "keywords": ["string", "string", "string", "string", "string"]
}

일기:
"${diary}"
`;

    try {
      const aiReply = await fetchAIResponse(prompt);
      const data = JSON.parse(aiReply);

      const emotions = data.감정분포 || data.emotion || data.감정;
      const keywords = data.주요키워드 || data.keywords || data.키워드;
      const summary = data.일기요약 || data.summary;

      // 차트 렌더링
      const labels = Object.keys(emotions);
      const values = labels.map(label => emotions[label]);
      if (emotionChart) {
        emotionChart.destroy();
      }

      // 예시: 파스텔톤 색상 배열 (감정 개수에 맞춰 추가/수정)
      const pastelColors = [
        '#FFCCD1', // 연분홍 → 핑크 톤을 강화
        '#FFE5CC', // 연베이지 → 약간 더 따뜻한 베이지
        '#CCFFF4', // 민트     → 약간 더 선명한 민트
        '#CCE5FF', // 연하늘   → 채도를 올린 스카이블루
        '#E5CCFF', // 연보라   → 보랏빛을 강화한 라벤더
        '#FFCCE5', // 연핑크   → 조금 더 쨍한 핑크
        '#CCFFD1', // 연초록   → 청록에 가까운 그린
        '#FFCCCC', // 연레드   → 부드러운 레드 계열
        '#FFD9CC', // 연오렌지 → 살구빛 오렌지
      ];

      emotionChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: pastelColors.slice(0, labels.length),
            },
          ],
        },
      });

      // 키워드 표시
      keywords.forEach((kw: string) => {
        const span = document.createElement('span');
        span.textContent = kw;
        span.className = 'px-2 py-1 bg-green-100 rounded';
        keywordsDiv.appendChild(span);
      });

      // 요약 표시
      summaryP.textContent = summary;

      resultDiv.hidden = false;
    } catch (error) {
      console.error(error);
      alert('감정 분석 중 오류가 발생했습니다.');
    } finally {
      loadingDiv.hidden = true;
    }
  });
});
