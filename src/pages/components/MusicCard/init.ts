// src/pages/components/MusicCard/init.ts
import { SpotifySearch } from './SpotifySearch';
import { getSongRecommendation } from '../../../utils/openai';
import type { SpotifyTrack } from '../../../utils/spotify';
import { MusicCard } from '.';

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
  new SpotifySearch(container);

  // URL 파라미터 확인
  const urlParams = new URLSearchParams(window.location.search);
  const fromDiary = urlParams.get('from_diary') === 'true';
  const fromAuth = urlParams.get('from_auth') === 'true';

  if (fromAuth) {
    try {
      const storedData = localStorage.getItem('spotify_last_search');
      if (!storedData) {
        console.error('로컬스토리지에 저장된 트랙 정보가 없습니다.');
        return;
      }

      const parsed = JSON.parse(storedData);
      const track: SpotifyTrack = parsed.track;

      const cardContainer = document.getElementById('spotify-search-container');
      if (!cardContainer) {
        console.error('MusicCard를 렌더링할 컨테이너가 없습니다.');
        return;
      }

      new MusicCard(cardContainer, track);

      // URL 파라미터 제거 (선택)
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('from_auth 처리 중 오류:', error);
    }
  }

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
