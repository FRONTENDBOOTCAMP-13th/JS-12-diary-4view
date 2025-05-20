import OpenAI from 'openai';
import Chart from 'chart.js/auto';

// OpenAI API 키 가져오기
const apiKey = import.meta.env.VITE_OPENAI_APIKEY;
const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
const MODEL = 'gpt-3.5-turbo'; // 사용할 GPT 모델

// DOM 요소
const resultDiv = document.getElementById('result')!; // 분석 결과 영역
const chartEl = document.getElementById('emotion-chart') as HTMLCanvasElement; // 차트 캔버스
const keywordsEl = document.getElementById('keywords')!; // 키워드 영역

/**
 * 일기 내용을 바탕으로 감정 분석을 요청합니다.
 * @param prompt - AI에 보낼 분석용 텍스트 프롬프트
 * @returns AI가 반환한 JSON 문자열
 */
async function getEmotionFromDiary(prompt: string): Promise<string> {
  // OpenAI Chat Completion API 호출
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
  });
  // 첫 번째 응답 메시지 내용을 문자열로 반환
  return (response.choices?.[0]?.message?.content ?? '').trim();
}

// DOM이 완전히 로드된 후 실행될 메인 로직
async function fetchChartData() {
  // 로컬 스토리지에서 저장된 일기 내용을 가져옵니다.
  const diary = localStorage.getItem('diary');
  if (!diary) {
    // 일기가 없으면 경고 후 작성 페이지로 이동
    alert('일기 내용이 없습니다. 먼저 작성해주세요.');
    window.location.href = '/src/pages/diary.html';
    return;
  }

  // AI에 보낼 프롬프트를 작성합니다.
  const prompt = `다음 일기를 꼼꼼히 분석하세요. 키워드는 일기에 있는 단어여야 하고 띄어쓰기가 없어야 합니다.
일기 내용:
"""
${diary}
"""
* emotion: 다음 지침을 엄격히 지키고, JSON만 출력하세요.
1. “emotion” 각 값은 0 이상의 정수여야 합니다.
2. 모든 값을 0으로만 채우면 안 됩니다. “emotion” 값들의 총합(sum of values)이 반드시 1 이상이어야 합니다.
3. 만약 일기 내용에서 특정 감정이 두드러진다고 판단되면, 그 감정에 최소 1 이상의 값을 반드시 부여하세요.
4. JSON 외 다른 텍스트(설명, 주석 등)는 절대 출력하지 마세요.
5. 모든 emotion 점수의 합계가 반드시 100이 되도록 분배하세요.
{
  "emotion": {
    "행복": 0,
    "슬픔": 0,
    "분노": 0,
    "흥분": 0,
    "불안": 0,
    "감사": 0,
    "지루함": 0,
    "긴장": 0,
    "평온": 0
  },
  "keywords": ["", "", "", "", ""]
}`;

  let data: { emotion: Record<string, number>; keywords: string[] };
  try {
    // AI로부터 JSON 문자열을 받아 파싱합니다.
    const text = await getEmotionFromDiary(prompt);
    data = JSON.parse(text);
  } catch (err) {
    console.error('파싱 오류:', err);
    alert('AI 응답 파싱에 실패했습니다. 콘솔 확인하세요.');
    return;
  }

  // emotion 객체를 [키, 값] 배열로 변환 후 값 기준 내림차순 정렬
  const entries = Object.entries(data.emotion).sort(([, a], [, b]) => b - a);
  const labels = entries.map(([k]) => k); // 감정 레이블 배열
  const values = entries.map(([, v]) => v); // 감정 값 배열

  // 차트 표시 설정
  chartEl.style.display = 'block';
  const pastelColors = [
    '#FFCCD1',
    '#FFE5CC',
    '#CCFFF4',
    '#CCE5FF',
    '#E5CCFF',
    '#FFCCE5',
    '#CCFFD1',
    '#FFFFCC',
    '#FFD9CC',
  ];
  // 기존 차트가 있으면 제거
  if ((window as any)._emotionChart) {
    (window as any)._emotionChart.destroy();
  }
  // 새로운 도넛 차트 생성
  (window as any)._emotionChart = new Chart(chartEl, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: pastelColors }],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            // 툴팁에 퍼센트 표시를 위한 콜백
            label: ctx => {
              const dataArr = ctx.dataset.data as number[];
              const total = dataArr.reduce((s, x) => s + x, 0);
              const percent =
                total > 0 ? ((ctx.raw as number) / total) * 100 : 0;
              return `${percent.toFixed(1)}%`;
            },
          },
        },
      },
    },
  });

  // 키워드를 최대 5개까지 잘라서 화면에 렌더링
  keywordsEl.innerHTML = data.keywords
    .slice(0, 5)
    .map(
      kw =>
        `<span class="inline-block bg-gray-100 px-3 py-1 mr-2 mb-2 rounded text-sm">#${kw}</span>`,
    )
    .join('');

  // 결과 영역을 보이도록 설정
  resultDiv.hidden = false;
}

export { fetchChartData };
