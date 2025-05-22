import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_APIKEY;
const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
});

const GPT_MODEL = 'gpt-3.5-turbo';

// document.addEventListener('DOMContentLoaded', () => {
//   getQuotable();
// });

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

  if (tags.length >= 2) {
    localStorage.setItem('tag1', tags[0]);
    localStorage.setItem('tag2', tags[1]);
  }

  let bestQuote:
    | {
        content_eng: string;
        content_kor: string;
        author_eng: string;
        author_kor: string;
      }
    | 0 = 0;

  for (const tag of tags) {
    const quotes = await getQuotesByTag(tag);
    console.log(`추천 태그 [${tag}]에 해당하는 모든 명언 :`, quotes);

    if (quotes.length === 0) {
      console.warn(`${tag} 태그에 명언 없음`);
      continue;
    }

    bestQuote = await getBestQuote(diary, quotes);

    if (bestQuote !== 0) {
      console.log('최종 추천 명언 :', bestQuote);
      return bestQuote;
    }

    console.warn(`[${tag}] 태그에서 적절한 명언을 찾지 못함! 다음 태그로 이동`);
  }

  console.warn('모든 태그에서 적절한 명언을 찾지 못함...');
  bestQuote = {
    content_eng: '"In the middle of every difficulty lies opportunity."',
    content_kor: '"모든 어려움 속에는 기회가 숨어 있다."',
    author_eng: 'Albert Einstein',
    author_kor: '알베르트 아인슈타인',
  };

  return bestQuote;
}

/**
 * @typedef {Object} Quote
 * @property {string} _id - 명언 ID
 * @property {string} author - 저자 이름
 * @property {string} content - 명언 내용
 * @property {string[]} tags - 태그 목록
 * @property {string} authorSlug - 저자 슬러그?
 * @property {number} length - 명언 길이
 * @property {string} dateAdded - 추가된 날짜
 * @property {string} dateModified - 수정된 날짜
 */
interface Quote {
  _id: string;
  author: string;
  content: string;
  tags: string[];
  authorSlug: string;
  length: number;
  dateAdded: string;
  dateModified: string;
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
 * @returns 모든 태그 목록
 * @description public/JSON/tags.json 파일에서 모든 태그 목록을 가져온다.
 */
async function loadAllTagsfromFile() {
  const filePath = '/JSON/tags.json';
  const response = await fetch(filePath);
  const allTags = await response.json();

  return allTags.map((tag: any) => tag.name);
}

/**
 *
 * @param diary 일기 내용
 * @returns 추천 태그 목록
 * @description 사용자가 작성한 일기를 바탕으로 GPT가 내용에 맞는 태그들를 추천한다.
 */
async function getTagfromDiary(diary: string): Promise<string[]> {
  const MAX_ATTEMPTS = 5;

  let allTags = await loadAllTagsfromFile();
  allTags = removeTag(['Sadness', 'Humor', 'Embarrassment'], allTags);
  console.log('모든 태그 :', allTags);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`GPT 태그 추천 시도 ${attempt}/${MAX_ATTEMPTS}`);

    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a strict tag selector. Your job is to ONLY return EXACTLY TWO tags from the given list. Do NOT create, translate, or modify tags. You must return ONLY tags that are in the list provided. Format must be: tag1, tag2 (separated by a comma, no extra text) This will be parsed by code, so DO NOT add explanations, quotation marks, or any other characters.`,
        },
        {
          role: 'user',
          content: `Diary: "${diary}" Available tags: ${JSON.stringify(allTags)} Pick the two most relevant tags from the list. Format: tag1, tag2 (must be from the list above)`,
        },
      ],
    });

    // GPT의 응답에서 태그 목록을 추출
    const rawTags = response.choices[0].message.content!.trim();

    const tagsSelectedByGPT = rawTags.split(',').map(tag => tag.trim());

    // 유효성 체크 : 선택된 태그가 모두 tags.json에 존재하는지 확인
    const validTags = tagsSelectedByGPT.filter(tag => allTags.includes(tag));

    // 유효한 태그가 2개여야 함
    if (validTags.length === 2) {
      console.log('유효한 태그 반환 :', validTags);
      return validTags;
    } else {
      console.warn(
        `GPT가 이상한 태그 반환함 : ${tagsSelectedByGPT.join(', ')}`,
      );
    }
  }

  console.error(
    '5번 시도에도 유효한(tags.json에 존재하는) 태그 얻지 못함. 아무 기본 태그 반환.',
  );
  return ['Life', 'Motivational'];
}

/**
 *
 * @param tag 태그
 * @returns 해당 태그에 해당하는 모든 명언 목록
 * @description public/JSON/quotes.json 파일에서 해당 태그에 해당하는 모든 명언을 가져와 반환한다.
 */
async function getQuotesByTag(tag: string): Promise<Quote[]> {
  const filePath = `/JSON/quotes.json`;
  const response = await fetch(filePath);
  const allQuotes = await response.json();
  const quotesByTag = allQuotes.filter((quote: any) =>
    quote.tags.includes(tag),
  );

  return quotesByTag;
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
  quotes: Quote[],
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
