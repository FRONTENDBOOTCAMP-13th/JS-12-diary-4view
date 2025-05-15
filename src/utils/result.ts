import Lottie from 'lottie-web';
import TypeIt from 'typeit';
// import { getImage } from './utils/openai';

export const loadLottie = (containerId: string, path: string) => {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Lottie container with id '${containerId}' not found.`);
    return;
  }

  container.innerHTML = '';

  Lottie.loadAnimation({
    container: container,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: path,
  });
};

function showLoading(show: boolean) {
  const container = document.getElementById('loadingContainer');
  const result = document.getElementById('result');

  if (!container || !result) return;

  if (show) {
    container.style.display = 'flex';
    result.style.display = 'none';
    loadLottie('lottieContainer', '/src/assets/lottie/loading.json');
    new TypeIt('#typingEffect', {
      strings: ['잠시만 기다려주세요...'],
      speed: 100,
      deleteSpeed: 50,
      breakLines: false,
      loop: true,
    }).go();
  } else {
    container.style.display = 'none';
    result.style.display = 'block';
  }
}

//TODO: 로딩 테스트를 위한 코드(수정 필요)
async function fetchOpenAIData() {
  return new Promise(res => setTimeout(() => res(`일기`), 5000));
}

async function fetchEmotionData() {
  return new Promise(res => setTimeout(() => res(`감정 분석`), 1200));
}

async function fetchSpotifyData() {
  return new Promise(res => setTimeout(() => res(`Spotify`), 1000));
}

async function fetchPhraseData() {
  return new Promise(res => setTimeout(() => res(`명언`), 800));
}

async function dataFetch() {
  showLoading(true);

  // const diary = localStorage.getItem('diary') || '';

  const [gpt, emotion, spotify, phrase] = await Promise.all([
    fetchOpenAIData(),
    fetchEmotionData(),
    fetchSpotifyData(),
    fetchPhraseData(),
  ]);

  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.innerHTML = `
      <p>${gpt}</p>
      <p>${emotion}</p>
      <p>${spotify}</p>
      <p>${phrase}</p>
    `;
  }

  showLoading(false);
}

dataFetch();

//TODO: test code
// const button = document.getElementById('test');
// const imgContainer = document.getElementById('imgcontainer');

// button?.addEventListener('click', async () => {
//   const diaryText =
//     '오늘은 북극곰, 토마스기차, 원숭이, 핫식스 캐리기터를 거진친구들과 코딩을 했다.';
//   const imageUrl = await getImage(diaryText);
//   if (imageUrl && imgContainer) {
//     imgContainer!.innerHTML = `<img src="${imageUrl}" alt="Generated Image" style="width:100%; max-width:400px; border-radius: 10px;" />`;
//   } else {
//     imgContainer!.innerHTML = `<p>이미지를 생성할 수 없습니다.</p>`;
//   }
// });
