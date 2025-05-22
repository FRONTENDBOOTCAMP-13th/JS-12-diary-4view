// src/pages/components/MusicCard/init.ts
// import { SpotifySearch } from './SpotifySearch';
import { getSongRecommendation } from '../../../utils/openai';

// document.addEventListener('DOMContentLoaded', async () => {
//   const container = document.getElementById('spotify-search-container');
//   if (!container) {
//     console.error('컨테이너를 찾을 수 없습니다.');
//     return;
//   }

//   fetchMusic();
//   // SpotifySearch 컴포넌트 초기화
//   // const spotifySearch = new SpotifySearch(container);

//   // // URL 파라미터 확인
//   // const urlParams = new URLSearchParams(window.location.search);
//   // const fromDiary = urlParams.get('from_diary') === 'true';

//   // if (fromDiary) {
//   //   // 다이어리에서 왔다면 GPT 추천을 사용하여 검색 실행
//   //   try {
//   //     // GPT로부터 추천받은 노래 가져오기
//   //     const songRecommendation = await getSongRecommendation();

//   //     if (songRecommendation) {
//   //       // 추천받은 노래로 검색 실행
//   //       (window as any).searchFromConsole(songRecommendation);

//   //       // URL 파라미터 제거
//   //       window.history.replaceState(
//   //         {},
//   //         document.title,
//   //         window.location.pathname,
//   //       );
//   //     } else {
//   //       console.error('노래 추천을 받지 못했습니다.');
//   //     }
//   //   } catch (error) {
//   //     console.error('노래 추천 처리 중 오류 발생:', error);
//   //   }
//   // }

//   // console.log('SpotifySearch 컴포넌트가 초기화되었습니다.');
// });

export async function fetchMusic(container: HTMLElement) {
  if (!container) {
    console.error('컨테이너를 찾을 수 없습니다.');
    return;
  }
  console.log('스포티파이 실행');
  // SpotifySearch 컴포넌트 초기화
  // const spotifySearch = new SpotifySearch(container);

  // URL 파라미터 확인
  const urlParams = new URLSearchParams(window.location.search);
  const fromDiary = urlParams.get('from_diary') === 'true';

  if (fromDiary) {
    // 다이어리에서 왔다면 GPT 추천을 사용하여 검색 실행
    try {
      // GPT로부터 추천받은 노래 가져오기
      const songRecommendation = await getSongRecommendation();

      if (songRecommendation) {
        // 추천받은 노래로 검색 실행
        (window as any).searchFromConsole(songRecommendation);

        // URL 파라미터 제거
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      } else {
        console.error('노래 추천을 받지 못했습니다.');
      }
    } catch (error) {
      console.error('노래 추천 처리 중 오류 발생:', error);
    }
  }

  console.log('SpotifySearch 컴포넌트가 초기화되었습니다.');
}
