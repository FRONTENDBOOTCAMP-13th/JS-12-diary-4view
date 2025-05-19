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

  /**
   * 검색 입력 필드 렌더링
   */
  private renderSearchInput(): void {
    // 입력 컨테이너 생성
    const inputContainer = document.createElement('div');
    inputContainer.className = 'spotify-search-input-container';

    // 텍스트 입력 생성
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '가수이름 노래제목';
    input.className = 'spotify-search-input placeholder-medium';

    // 검색 버튼 생성
    const searchButton = document.createElement('button');
    searchButton.textContent = '검색';
    searchButton.className = 'spotify-search-button paragraph-medium';

    // 검색 버튼에 이벤트 리스너 추가
    searchButton.addEventListener('click', async () => {
      const query = input.value.trim();
      if (query) {
        await this.searchTrack(query);
      }
    });

    // Enter 키에 이벤트 리스너 추가
    input.addEventListener('keypress', async e => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          await this.searchTrack(query);
        }
      }
    });

    // 요소들을 컨테이너에 추가
    inputContainer.appendChild(input);
    inputContainer.appendChild(searchButton);
    this.container.appendChild(inputContainer);
  }

  /**
   * 트랙 검색
   */
  private async searchTrack(query: string): Promise<void> {
    try {
      // 검색어 형식 검증
      const parts = query.split(' ');
      if (parts.length < 2) {
        this.showError('검색어 형식은 "가수이름 노래제목" 입니다.');
        return;
      }

      // Spotify API로 검색
      const result = await spotifyAPI.searchTrack(query);

      if (!result) {
        this.showError('검색 중 오류가 발생했습니다.');
        return;
      }

      if (!result.tracks || result.tracks.items.length === 0) {
        this.showError('검색 결과가 없습니다.');
        return;
      }

      // 기존 MusicCard가 있다면 제거
      if (this.musicCard) {
        this.musicCard.destroy();
        this.musicCard = null;
      }

      // 결과 컨테이너 초기화
      this.resultsContainer.innerHTML = '';

      // 첫 번째 트랙 가져오기
      const track = result.tracks.items[0];

      // MusicCard 생성
      this.musicCard = new MusicCard(this.resultsContainer, track, {
        onPlay: async previewUrl => {
          // 미리듣기 URL이 있다면 바로 재생
          console.log('onPlay 콜백 진입');
          if (previewUrl) {
            const audio = new Audio(previewUrl);
            audio.play();
          } else {
            // 미리듣기 URL이 없으면 사용자 인증 상태 확인
            const isAuthenticated = await spotifyAPI.isAuthenticated();
            if (!isAuthenticated) {
              // 로그인이 필요하다는 메시지 표시
              this.showLoginMessage();
              console.log('재생버튼 활성화');
            } else {
              // Spotify Web API로 재생 시도
              const success = await spotifyAPI.playTrack(
                `spotify:track:${track.id}`,
              );
              if (!success) {
                this.showError(
                  '재생에 실패했습니다. Spotify 앱이 실행 중인지 확인해주세요.',
                );
              }
            }
          }
        },
      });

      // 트랙 선택 콜백 호출
      if (this.options.onTrackSelected) {
        this.options.onTrackSelected(track);
      }
    } catch (error) {
      console.error('검색 오류:', error);
      this.showError('검색 중 오류가 발생했습니다.');
    }
  }

  /**
   * 오류 표시
   */
  private showError(message: string): void {
    this.resultsContainer.innerHTML = `<div class="spotify-error">${message}</div>`;
  }

  /**
   * 로그인 메시지 표시
   */
  private showLoginMessage(): void {
    // 매번 저장 (조건 제거)
    this.previousContent = this.resultsContainer.innerHTML;

    // 결과 컨테이너 초기화
    this.resultsContainer.innerHTML = '';

    const loginMessageContainer = document.createElement('div');
    loginMessageContainer.className = 'spotify-login-message';
    loginMessageContainer.innerHTML = `
      <p>로그인해야 음악을 </br>재생할 수 있습니다.</p>
      <button class="spotify-login-button">Spotify 로그인</button>
      <button class="spotify-cancel-button">취소</button>
    `;

    const loginButton = loginMessageContainer.querySelector(
      '.spotify-login-button',
    );
    if (loginButton) {
      loginButton.addEventListener('click', () => {
        spotifyAPI.initiateLogin();
      });
    }

    const cancelButton = loginMessageContainer.querySelector(
      '.spotify-cancel-button',
    );
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        // 토큰 제거
        spotifyAPI.logout();
        // 이전 화면 복원
        if (this.previousContent !== null) {
          this.resultsContainer.innerHTML = this.previousContent;
          this.previousContent = null;
        }
      });
    }

    this.resultsContainer.appendChild(loginMessageContainer);
    console.log('로그인 안내창이 활성화');
  }
}
