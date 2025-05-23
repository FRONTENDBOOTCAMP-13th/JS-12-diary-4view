import html2canvas from 'html2canvas-pro';
import Lottie from 'lottie-web';
import TypeIt from 'typeit';
import { fetchSummary } from '../utils/summary';
import { getQuotable } from '../utils/quotable';
import { fetchImage } from '../utils/openai';
import { fetchChartData } from '../utils/emotion';
import { fetchEmpathyResponse } from '../utils/chatbot';
import { getGifUrlByTags } from '../utils/tenor';
import { fetchMusic } from './components/MusicCard/init';

// ─────────────────────────────
// Global Element References
// ─────────────────────────────
const imageEl = document.getElementById('diary-image') as HTMLImageElement;
const captureDiv = document.getElementById('capture') as HTMLElement;
const downloadBtn = document.getElementById('downloadBtn') as HTMLButtonElement;
const initialBtn = document.getElementById('initialBtn') as HTMLButtonElement;
const changeBtn = document.getElementById('changeBtn') as HTMLButtonElement;
const summaryEl = document.getElementById('summary') as HTMLElement;
const empathyEl = document.getElementById('empathy') as HTMLElement;
const viewDiaryBtn = document.getElementById(
  'viewDiaryBtn',
) as HTMLButtonElement;
const loadingContainer = document.getElementById(
  'loadingContainer',
) as HTMLElement;
const diaryText = document.getElementById('diaryText') as HTMLElement;
const overlay = document.getElementById('overlay') as HTMLElement;
const resultContainer = document.getElementById('result') as HTMLElement;
const titleEl = document.getElementById('dateTitle');
const quoteEl = document.getElementById('quote');
const authorEl = document.getElementById('author');
const tenorEl = document.getElementById('tenor') as HTMLImageElement;
const container = document.getElementById(
  'spotify-search-container',
) as HTMLElement;

let typeItInstance: TypeIt | null = null;

// ─────────────────────────────
// Entry
// ─────────────────────────────

/**
 * 페이지가 로드되면 데이터를 가져옵니다.
 */
const tag1 = localStorage.getItem('tag1') ?? 'Happiness';
const tag2 = localStorage.getItem('tag2') ?? 'Friendship';
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const fromAuth = params.get('from_auth');

  if (fromAuth === 'true') {
    restoreFromLocalStorage();
  } else {
    dataFetch();
  }
  const diary = localStorage.getItem('diary');

  if (diary && diaryText) {
    diaryText.textContent = diary;
  }
  if (titleEl) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const formattedDate = `${year}년 ${month}월 ${day}일 감정일기`;
    titleEl.textContent = formattedDate;
  }
});

// ─────────────────────────────
// Main Data Fetch
// ─────────────────────────────

/**
 * 모든 데이터를 병렬로 fetch한 후 화면에 표시합니다.
 * 이미지, 요약, 음악, 명언, 공감문장 등을 가져옵니다.
 */
async function dataFetch(): Promise<void> {
  showLoading(true);

  try {
    const diary = localStorage.getItem('diary');

    if (!diary) {
      alert('일기 내용 없음. 일기를 먼저 작성해주세요.');
      window.location.href = '/src/pages/diary.html';
      return;
    }

    const [image, summary, bestQuote, empathy, tenor] = await Promise.all([
      fetchImage(),
      fetchSummary(),
      getQuotable(),
      fetchEmpathyResponse(),
      getGifUrlByTags(tag1, tag2),
      fetchMusic(container),
      fetchChartData(),
    ]);

    console.log(bestQuote);

    if (bestQuote) {
      if (quoteEl) quoteEl.textContent = bestQuote.content_kor;
      if (authorEl) authorEl.textContent = bestQuote.author_kor;
    }
    if (image && imageEl) imageEl.src = image as string;
    if (summaryEl) summaryEl.textContent = summary as string;
    if (empathyEl) empathyEl.textContent = empathy as string;

    if (tenorEl && tenor) {
      tenorEl.src = tenor;
    }
    // 저장할 객체를 구성
    const resultData = {
      summary,
      quote: bestQuote,
      empathy,
      gif: tenor,
      image: imageEl?.src ?? '',
    };

    // 객체를 JSON 문자열로 변환하여 저장
    localStorage.setItem('result', JSON.stringify(resultData));
  } catch (err) {
    console.error('데이터 불러오기 실패:', err);
  } finally {
    showLoading(false);
  }
}

// ─────────────────────────────
// Event Handlers
// ─────────────────────────────

/**
 * 이미지 변경 버튼 클릭 시 새로운 이미지 fetch 및 적용합니다.
 */
changeBtn.addEventListener('click', async () => {
  const icon = changeBtn.querySelector('img');
  changeBtn.disabled = true;
  icon?.classList.add('animate-spin');

  try {
    const newImage = await fetchImage();
    imageEl.src = newImage as string;
  } catch (err) {
    console.error('이미지 불러오기 실패:', err);
  } finally {
    changeBtn.disabled = false;
    icon?.classList.remove('animate-spin');
  }
});

/**
 * 현재 capture 영역을 이미지로 저장합니다.
 */
downloadBtn.addEventListener('click', async () => {
  await document.fonts.ready;

  html2canvas(captureDiv, {
    useCORS: true,
    backgroundColor: '#ffffff',
    scale: 2,
    allowTaint: false,
    logging: false,
  })
    .then(canvas => {
      const link = document.createElement('a');
      link.download = 'capture.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    })
    .catch(err => console.error('캡처 실패:', err));
});

initialBtn.addEventListener('click', () => {
  window.location.href = '/src/pages/initial.html';
});

viewDiaryBtn.addEventListener('click', () => {
  diaryText.classList.toggle('hidden');
  overlay.classList.toggle('hidden');
});

// ─────────────────────────────
// Utilities
// ─────────────────────────────

/**
 * Lottie 애니메이션을 지정한 DOM 컨테이너에 로드합니다.
 * @param {string} containerId - 애니메이션을 삽입할 컨테이너 ID
 * @param {string} path - Lottie JSON 파일 경로
 */
export function loadLottie(containerId: string, path: string): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Lottie container with id '${containerId}' not found.`);
    return;
  }

  container.innerHTML = '';

  Lottie.loadAnimation({
    container,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path,
  });
}

/**
 * 로딩 화면과 결과 화면을 전환합니다.
 * @param {boolean} show - true면 로딩 화면 표시, false면 결과 화면 표시
 */
function showLoading(show: boolean): void {
  if (!loadingContainer || !resultContainer) return;

  if (show) {
    loadingContainer.style.display = 'flex';
    resultContainer.style.display = 'none';
    loadLottie('lottieContainer', '/assets/lottie/loading.json');

    if (typeItInstance) typeItInstance.destroy();
    typeItInstance = new TypeIt('#typingEffect', {
      strings: ['잠시만 기다려주세요...'],
      speed: 100,
      deleteSpeed: 50,
      breakLines: false,
      loop: true,
    }).go();
  } else {
    loadingContainer.style.display = 'none';
    resultContainer.style.display = 'flex';
  }
}

function restoreFromLocalStorage() {
  loadingContainer.style.display = 'none';
  const raw = localStorage.getItem('result');
  if (!raw) return;

  try {
    fetchChartData();
    fetchMusic(container);
    const result = JSON.parse(raw);

    if (result.summary && summaryEl) summaryEl.textContent = result.summary;
    if (result.quote && quoteEl && authorEl) {
      quoteEl.textContent = result.quote.content_kor;
      authorEl.textContent = result.quote.author_kor;
    }
    if (result.empathy && empathyEl) empathyEl.textContent = result.empathy;
    if (result.gif && tenorEl) tenorEl.src = result.gif;
    if (result.image && imageEl) imageEl.src = result.image;
  } catch (err) {
    console.error('result 로컬스토리지 파싱 실패:', err);
  }
}
