const tenorApiKey = import.meta.env.VITE_TENOR_APIKEY;

/**
 *
 * @param tag1 검색 태그 1
 * @param tag2 검색 태그 2
 * @description 두 개의 태그를 조합, tenor api를 이용하여 GIF URL을 가져오는 함수. 사진의 비율을 체크해 가로 세로 비율이 1.5 이상인 경우에만 URL을 반환한다.
 * @returns gif 파일의 URL
 */
async function getGifUrlByTags(
  tag1: string,
  tag2: string,
): Promise<string | null> {
  const query = `${encodeURIComponent(tag1)} ${encodeURIComponent(tag2)}`;
  let gif;
  let gifUrl = '';

  // 랜덤한 GIF 10개 fetch 시도
  const response = await fetch(
    `https://tenor.googleapis.com/v2/search?q=${query}&key=${tenorApiKey}&limit=10&random=true`,
  );

  // API 호출 실패 시 에러 처리
  if (!response.ok) {
    console.error('Tenor API 호출 실패:', response.statusText);
    return null;
  }

  const data = await response.json();
  const results = data.results;

  console.log('GIF 검색 결과:', results);

  for (const result of results) {
    gif = result?.media_formats?.gif;
    const dims = gif.dims;

    if (isLandscapeRatio(dims)) {
      gifUrl = gif.url;
      break;
    }
  }

  if (gifUrl === '') {
    gifUrl = 'https://media1.tenor.com/m/V04TswvbSR4AAAAd/river-water.gif';
  }

  console.log('최종 GIF URL:', gifUrl);

  return gifUrl;
}

/**
 *
 * @param dims 가로 세로 크기가 담긴 Json 배열
 * @returns true: 가로 세로 비율이 1.5 이상인 경우 (16:9 비율의 경우 ratio가 1.77)
 */
function isLandscapeRatio(dims: number[]) {
  const width = dims[0];
  const height = dims[1];
  const ratio = width / height;

  return ratio > 1.5;
}

export { getGifUrlByTags };
