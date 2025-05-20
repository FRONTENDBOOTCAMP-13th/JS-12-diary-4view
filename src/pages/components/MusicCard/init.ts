// src/pages/components/MusicCard/init.ts
import { SpotifySearch } from './SpotifySearch';
import { spotifyAPI } from '../../../utils/spotify';

export function initSpotifySearch() {
  // 페이지 로드 시 컴포넌트 초기화
  const container = document.getElementById('spotify-search-container');
  if (container) {
    // SpotifySearch 컴포넌트 생성
    const spotifySearch = new SpotifySearch(container, {
      onTrackSelected: track => {
        console.log('선택된 트랙:', track);
      },
    });

    // 전역 객체에 컴포넌트 저장 (콘솔에서 접근 가능)
    (window as any).spotifySearch = spotifySearch;

    // spotifyAPI도 전역 객체에 저장 (디버깅 용도)
    (window as any).spotifyAPI = spotifyAPI;
  }
}

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', initSpotifySearch);
