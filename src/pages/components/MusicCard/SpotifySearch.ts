/* 검색과 결과 관리를 담당 */
// pages/components/MusicCard/SpotifySearch.ts
import { spotifyAPI } from '../../../utils/spotify';
import { MusicCard } from './index';
import './style.css';

// 타입 임포트
import type { SpotifyTrack } from '../../../utils/spotify';

export interface SpotifySearchOptions {
  onTrackSelected?: (track: SpotifyTrack) => void;
}

export class SpotifySearch {
  private container: HTMLElement;
  private resultsContainer: HTMLElement;
  private musicCard: MusicCard | null = null;
  private options: SpotifySearchOptions;
  private previousContent: string | null = null; // 이전 컨텐츠를 저장할 속성

  /**
   * SpotifySearch 컴포넌트 생성자
   */
  constructor(container: HTMLElement, options: SpotifySearchOptions = {}) {
    this.container = container;
    this.options = options;
    this.container.className = 'spotify-search-container commonLayoutContainer';

    // 결과 컨테이너 생성
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.className = 'spotify-search-results';

    this.initialize();
  }

  /**
   * 컴포넌트 초기화
   */
  private async initialize(): Promise<void> {
    // 검색 입력 컨테이너 생성
    this.renderSearchInput();

    // 결과 컨테이너 추가
    this.container.appendChild(this.resultsContainer);

    // 콘솔에서 검색할 수 있는 메서드 노출
    (window as any).searchFromConsole = async (query: string) => {
      if (query) {
        await this.searchTrack(query);
      }
    };

    console.log(
      'Spotify 검색 컴포넌트가 초기화되었습니다. searchFromConsole("가수이름 노래제목")을 사용하여 테스트할 수 있습니다.',
    );
  }
}
