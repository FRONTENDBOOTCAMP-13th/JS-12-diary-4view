const tenorApiKey = import.meta.env.VITE_TENOR_APIKEY;

document.addEventListener('DOMContentLoaded', () => {
  const image = document.querySelector('img') as HTMLImageElement;

  const tag1 = localStorage.getItem('tag1') ?? 'Happiness';
  const tag2 = localStorage.getItem('tag2') ?? 'Friendship';

  const gifUrl = getGifUrlByTags(tag1, tag2);
  setSrc(image, gifUrl);
});

/**
 *
 * @param image gif를 넣을 이미지 요소
 * @param gifUrl fetch로 가져온 gif URL promise
 * @returns void
 */
async function setSrc(image: HTMLImageElement, gifUrl: Promise<string | null>) {
  const url = await gifUrl;
  if (!url) {
    console.warn('적당한 GIF URL 없음');
    return;
  }

  console.log('GIF URL:', url);
  image.src = url;
}

/**
 *
 * @param tag1 검색 태그 1
 * @param tag2 검색 태그 2
 * @description 두 개의 태그를 조합하여 tenor api를 이용 -> GIF URL을 가져오는 함수
 * @returns gif 파일의 URL
 */
async function getGifUrlByTags(
  tag1: string,
  tag2: string,
): Promise<string | null> {
  const query = `${encodeURIComponent(tag1)} ${encodeURIComponent(tag2)}`;
  const response = await fetch(
    `https://tenor.googleapis.com/v2/search?q=${query}&key=${tenorApiKey}&limit=1&random=true`,
  );

  if (!response.ok) {
    console.error('Tenor API 호출 실패:', response.statusText);
    return null;
  }

  const data = await response.json();
  const gifUrl = data.results?.[0]?.media_formats?.gif?.url;
  return gifUrl ?? null;
}
