import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_APIKEY;
const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
});

const GPT_MODEL = 'gpt-3.5-turbo';

document.addEventListener('DOMContentLoaded', () => {
  getQuotable();
});

export async function getQuotable() {
  // 일기 내용 가져오기
  const diary = localStorage.getItem('diary');

  if (!diary) {
    console.warn('일기 내용 없음');
    return;
  }

  // 일기 내용을 기반으로 태그 추천
  const tags = await getTagfromDiary(diary);
  console.log('추천 태그:', tags);

  for (const tag of tags) {
    const quotes = await getQuotesByTags(tag, 10);

    if (quotes.length === 0) {
      console.warn(`${tag} 태그에 명언 없음`);
      continue;
    }

    let bestQuote:
      | {
          content_eng: string;
          content_kor: string;
          author_eng: string;
          author_kor: string;
        }
      | 0 = 0;

    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`GPT 추천 시도 ${attempt}/5 [${tag}]`);
      bestQuote = await getBestQuote(diary, quotes);

      if (bestQuote !== 0) {
        console.log('최종 추천 명언 :', bestQuote);
        return bestQuote;
      }
    }

    console.warn(`[${tag}] 태그에서 적절한 명언을 찾지 못함! 다음 태그로 이동`);
  }

  console.warn('모든 태그에서 적절한 명언을 찾지 못함...');
}

/**
 *
 * @returns 태그 목록
 * @description Quatable API에서 태그 목록을 가져온다.
 */
async function loadQuotableTags(): Promise<string[]> {
  try {
    const response = await fetch('https://api.quotable.io/tags');
    if (!response.ok) throw new Error('Quotable API Fetch 실패');
    const data = await response.json();
    return data.map((tag: any) => tag.name);
  } catch (error) {
    console.error('태그 가져오기 실패 :', error);
    return [];
  }
}

/**
 *
 * @param removeTags 제거할 태그 목록
 * @param tags 전체 태그 목록
 * @returns 제거된 태그 목록
 * @description Quotable API의 태그들 중에서 구성상 부적합한 태그를 제거한다.
 */
function removeTag(removeTags: string[], tags: string[]): string[] {
  return tags.filter(tag => !removeTags.includes(tag));
}

/**
 *
 * @param diary 일기 내용
 * @returns 추천 태그 목록
 * @description 사용자가 작성한 일기를 바탕으로 GPT가 내용에 맞는 태그들를 추천한다.
 */
async function getTagfromDiary(diary: string): Promise<string[]> {
  // Quatable API에서 태그 목록을 가져옴
  let allTags = await loadQuotableTags();

  // 구성상 부적합한 태그들을 제거
  allTags = removeTag(['Sadness', 'Humor', 'Embarrassment'], allTags);
  console.log('모든 태그 :', allTags);

  // 사용자가 작성한 일기와 가져온 태그를 바탕으로 GPT가 일기 내용에 해당하는 태그를 2개 가져옴.
  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an emotional analyst. Based on a given diary entry and a list of predefined tags, you must select ONLY TWO most suitable tags that match the emotional or contextual tone of the diary. You must return the tags in a comma-separated English format, exactly like this: "tag1, tag2" (no line breaks, no extra explanation). Do not invent or translate tags. Only use the ones provided.`,
      },
      {
        role: 'user',
        content: `Diary: "${diary}" Available tags: ${allTags.join(', ')} Pick the two most relevant tags from the list and return them in the format: tag1, tag2.`,
      },
    ],
  });

  const result = response.choices[0].message.content ?? '';

  return result
    .replace(/#/g, '')
    .split(', ')
    .map(tag => tag.trim());
}

/**
 *
 * @param tag 검색 조건이 될 태그
 * @param limit 한번에 가져올 명언의 개수
 * @description Quatable API에서 tag에 해당하는 명언을 limit개 가져온다.
 * @returns 가져온 명언 목록
 */
async function getQuotesByTags(
  tag: string,
  limit: number = 10,
): Promise<{ content: string; author: string }[]> {
  try {
    const response = await fetch(
      `https://api.quotable.io/quotes/random?tags=${tag}&limit=${limit}`,
    );
    if (!response.ok) throw new Error('QuoteAPI 호출 실패');

    const quotes = await response.json();

    return quotes.map((q: any) => ({
      content: q.content,
      author: q.author,
    }));
  } catch (err) {
    console.error('명언 가져오기 실패 : ', err);
    return [];
  }
}

/**
 *
 * @param diary 일기 내용
 * @param quotes GPT에게 전달할 명언 목록
 * @description 사용자가 작성한 일기와 명언 목록을 바탕으로 GPT에게 가장 적절한 명언을 추천받음
 * @returns 가장 적절한 명언 혹은 0(적절한 명언이 없을 경우)
 */
async function getBestQuote(
  diary: string,
  quotes: { content: string; author: string }[],
): Promise<
  | {
      content_eng: string;
      content_kor: string;
      author_eng: string;
      author_kor: string;
    }
  | 0
> {
  // quotes를 GPT에게 전달하기 위해 문자열로 변환
  const formattedQuotes = quotes
    .map(q => `"${q.content}" - ${q.author}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an emotional analyst and translator. Based on the user's diary and a list of quotes, you must select the most emotionally appropriate quote. If a suitable quote exists, return it with the original English text and a natural Korean translation. Include both the author's English name and Korean name.`,
      },
      {
        role: 'user',
        content: `Here is the user's diary and a list of quotes :
        [Diary]
        ${diary}
        
        [Quotes]
        ${formattedQuotes}
        
        If there is a suitable quote, respond **exactly** in the following JSON format:
        
        {
          "content_eng": "Original English quote",
          "content_kor": "Natural Korean translation",
          "author_eng": "Author's name in English",
          "author_kor": "Author's name in Korean"
        }
          
        If none of the quotes are appropriate, simply return: 0.
        Do not include any explanation or extra text.`,
      },
    ],
  });

  const result = response.choices[0].message.content?.trim();

  // 결과가 없거나 0인 경우
  if (!result || result === '0') return 0;

  try {
    // JSON 파싱
    const parsed = JSON.parse(result);

    // 결과값이 유효한지 검사
    if (
      !parsed.content_eng ||
      !parsed.content_kor ||
      !parsed.author_eng ||
      !parsed.author_kor
    )
      return 0;

    // 결과값이 유효한 경우 객체로 반환
    return {
      content_eng: parsed.content_eng.trim(),
      content_kor: parsed.content_kor.trim(),
      author_eng: parsed.author_eng.trim(),
      author_kor: parsed.author_kor.trim(),
    };
  } catch (err) {
    console.warn('GPT 응답 JSON 파싱 실패 :', err);
    return 0;
  }
}
