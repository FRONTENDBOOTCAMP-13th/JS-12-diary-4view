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

    loadingDiv.hidden = false;
    resultDiv.hidden = true;
    keywordsDiv.innerHTML = '';

    const prompt = `
아래 형식의 JSON 객체 하나만 응답해주세요. 다른 텍스트를 섞지 마세요. 키워드는 명사로 답하세요.

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

      const emotions = data.emotion || data.감정분포 || data.감정;
      const keywords = data.keywords || data.주요키워드 || data.키워드;

      // 1) {label, value} 배열로 변환 및 내림차순 정렬
      const entries = Object.entries(emotions)
        .map(([label, value]) => ({ label, value: Number(value) }))
        .sort((a, b) => b.value - a.value);

      const sortedLabels = entries.map(e => e.label);
      const sortedValues = entries.map(e => e.value);

      // 2) 색상
      const pastelColors = [
        '#FFCCD1',
        '#FFE5CC',
        '#CCFFF4',
        '#CCE5FF',
        '#E5CCFF',
        '#FFCCE5',
        '#CCFFD1',
        '#FFCCCC',
        '#FFD9CC',
      ];
      const sortedColors = pastelColors.slice(0, entries.length);

      // 3) 기존 차트 파괴
      if (emotionChart) {
        emotionChart.destroy();
      }

      // 4) 새 차트 생성 (퍼센트 툴팁 포함)
      emotionChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
          labels: sortedLabels,
          datasets: [
            {
              data: sortedValues,
              backgroundColor: sortedColors,
            },
          ],
        },
        options: {
          plugins: {
            tooltip: {
              callbacks: {
                label: ctx => {
                  const dataArr = ctx.dataset.data as number[];
                  const total = dataArr.reduce((sum, v) => sum + v, 0);
                  const value = Number(ctx.raw);
                  const pct = ((value / total) * 100).toFixed(1);
                  return `${ctx.label}: ${pct}%`;
                },
              },
            },
          },
        },
      });

      // 5) 키워드 표시
      keywords.forEach((kw: string) => {
        const span = document.createElement('span');
        span.textContent = kw;
        span.className = 'px-2 py-1 bg-green-100 rounded';
        keywordsDiv.appendChild(span);
      });

      resultDiv.hidden = false;
    } catch (error) {
      console.error(error);
      alert('감정 분석 중 오류가 발생했습니다.');
    } finally {
      loadingDiv.hidden = true;
    }
  });
});
