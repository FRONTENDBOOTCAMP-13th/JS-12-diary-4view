import Lottie from 'lottie-web';
import TypeIt from 'typeit';
// import { fetchAIResponse } from './chatbot';
// import { getImage } from './openai';
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
  return new Promise(res => setTimeout(() => res(`위로`), 1000));
  // const diary = localStorage.getItem('diary');
  // const prompt = `아래 일기를 읽고 공감 문장이나, 간단한 조언 한 줄 등 답변해줘:\n"${diary}"`;
  // console.log(`공감 위로 프롬프트 : ${prompt}`);
  // return fetchAIResponse(prompt);
}

async function fetchImageData() {
  return new Promise(res => setTimeout(() => res(`이미지`), 1000));
  // const diary = localStorage.getItem('diary') || '';
  // return getImage(diary);
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

  const [gpt, image, spotify, phrase] = await Promise.all([
    fetchOpenAIData(),
    fetchImageData(),
    fetchSpotifyData(),
    fetchPhraseData(),
  ]);

  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.innerHTML = /*html*/ `
      <p>${gpt}</p>
      <div><img src="${image}" alt="Generated Image" style="width:100%; max-width:400px; border-radius: 10px;" /></div>
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
