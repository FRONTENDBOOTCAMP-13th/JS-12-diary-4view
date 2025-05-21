const tenorApiKey = import.meta.env.VITE_TENOR_APIKEY;

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

export { getGifUrlByTags };
