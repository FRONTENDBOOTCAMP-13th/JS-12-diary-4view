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

  private clientId: string = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  private redirectUri: string =
    import.meta.env.VITE_CALLBACK_URI || 'http://127.0.0.1:5173';
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

    // 컨테이너에 결과 컨테이너 바로 추가
    this.container.appendChild(this.resultsContainer);

    this.initialize();

    // URL 파라미터 확인하여 인증 코드 처리
    this.checkAuthCode();
  }
  /**
   * 인증 성공 후 UI 업데이트
   */
  private updateUIAfterAuth(): void {
    // 성공 메시지 표시
    const successMessage = document.createElement('div');
    successMessage.className = 'spotify-success-message';
    successMessage.innerHTML = `
    <p>Spotify 로그인 성공!</p>
    <p>이제 음악을 재생할 수 있습니다.</p>
  `;

    // 메시지를 표시하기 전에 이전 콘텐츠 저장
    if (
      this.resultsContainer.innerHTML &&
      this.resultsContainer.innerHTML !== ''
    ) {
      this.previousContent = this.resultsContainer.innerHTML;
    }

    // 메시지 표시
    this.resultsContainer.innerHTML = '';
    this.resultsContainer.appendChild(successMessage);

    // 3초 후 메시지 제거
    setTimeout(() => {
      // 이전 콘텐츠가 있으면 복원
      if (this.previousContent) {
        this.resultsContainer.innerHTML = this.previousContent;
        this.previousContent = null;
      } else {
        this.resultsContainer.innerHTML = '<p>음악을 검색해 보세요.</p>';
      }
    }, 3000);
  }

  // 토큰이 만료되었는지 확인하는 메서드 추가
  private isTokenExpired(): boolean {
    const expiryTime = localStorage.getItem('spotify_token_expiry');
    if (!expiryTime) return true;

    const expiryTimeNumber = parseInt(expiryTime, 10);
    const isExpired = Date.now() > expiryTimeNumber;

    if (isExpired) {
      console.log('Spotify 토큰이 만료되었습니다. 갱신이 필요합니다.');
    }

    return isExpired;
  }

  /**
   * 토큰 갱신
   */
  private async refreshToken(): Promise<boolean> {
    console.log('토큰 갱신 시도 중...');
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) {
      console.error('갱신 토큰이 없습니다. 다시 로그인이 필요합니다.');
      return false;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
        }).toString(),
      });

      if (!response.ok) {
        // 응답 데이터 확인
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch {
          errorText = await response.text();
        }

        console.error('토큰 갱신 실패:', response.status, errorText);
        throw new Error(`토큰 갱신 실패: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();
      console.log('토큰 갱신 성공!');

      // 토큰 업데이트
      localStorage.setItem('spotify_access_token', tokenData.access_token);
      localStorage.setItem(
        'spotify_token_expiry',
        String(Date.now() + tokenData.expires_in * 1000),
      );

      if (tokenData.refresh_token) {
        localStorage.setItem('spotify_refresh_token', tokenData.refresh_token);
      }

      return true;
    } catch (error) {
      console.error('토큰 갱신 오류:', error);
      return false;
    }
  }

  /**
   * 인증 코드 확인 및 처리
   */
  private async checkAuthCode(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    console.log('URL 파라미터 확인:', {
      code: code ? `${code.substring(0, 10)}...` : null,
      error,
    });

    if (error) {
      console.error('Spotify 인증 오류:', error);
      this.showError(`Spotify 인증 오류: ${error}`);
      return;
    }

    if (code) {
      // 디버깅: 코드 검증기 확인
      const codeVerifier = localStorage.getItem('spotify_code_verifier');
      console.log('코드 검증기 확인:', {
        exists: !!codeVerifier,
        length: codeVerifier ? codeVerifier.length : 0,
      });
      try {
        // 코드를 토큰으로 교환
        const success = await this.exchangeCodeForToken(code);
        console.log('토큰 교환 결과:', {
          success,
          access_token_exists: !!localStorage.getItem('spotify_access_token'),
          refresh_token_exists: !!localStorage.getItem('spotify_refresh_token'),
        });
        if (success) {
          console.log('인증 성공! 토큰이 저장되었습니다.');
          // URL에서 코드 파라미터 제거
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );

          // UI 업데이트
          this.updateUIAfterAuth();
        } else {
          console.error('토큰 교환 실패');
          this.showError('토큰 교환에 실패했습니다');
        }
      } catch (error) {
        console.error('토큰 교환 오류:', error);
        this.showError('인증 처리 중 오류가 발생했습니다');
      }
    }
  }

  /**
   * 코드를 토큰으로 교환
   */
  private async exchangeCodeForToken(code: string): Promise<boolean> {
    // 로컬 스토리지에서 코드 검증기 가져오기
    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    if (!codeVerifier) {
      console.error(
        '코드 검증기를 찾을 수 없습니다. 인증 프로세스를 다시 시작해야 합니다.',
      );
      return false;
    }

    try {
      console.log('토큰 교환 시도 중...', {
        redirect_uri: this.redirectUri,
        code_verifier_length: codeVerifier.length,
      });

      // 토큰 교환 요청
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId, // Spotify 클라이언트 ID
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri, // 리디렉션 URI
          code_verifier: codeVerifier,
        }).toString(),
      });

      if (!response.ok) {
        // 응답 데이터 확인
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch {
          errorText = await response.text();
        }

        console.error('토큰 응답 실패:', response.status, errorText);
        throw new Error(`토큰 응답 오류: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();
      console.log('토큰 응답 성공!', {
        access_token: `${tokenData.access_token.substring(0, 10)}...`,
        expires_in: tokenData.expires_in,
        has_refresh_token: !!tokenData.refresh_token,
      });

      // 토큰 저장 - 여러 키로 저장하여 호환성 유지
      localStorage.setItem('spotify_access_token', tokenData.access_token);
      localStorage.setItem('spotify_user_token', tokenData.access_token); // 추가: 두 가지 키에 저장

      const expiryTime = Date.now() + tokenData.expires_in * 1000;
      localStorage.setItem('spotify_token_expiry', String(expiryTime));
      localStorage.setItem('spotify_user_token_expiry', String(expiryTime)); // 추가

      if (tokenData.refresh_token) {
        localStorage.setItem('spotify_refresh_token', tokenData.refresh_token);
      }

      return true;
    } catch (error) {
      console.error('토큰 교환 오류:', error);
      return false;
    }
  }

  /**
   * 컴포넌트 초기화
   */
  private async initialize(): Promise<void> {
    // 검색 입력 필드 렌더링 부분 제거 (renderSearchInput 호출 제거)

    // URL에서 인증 관련 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const fromAuth = urlParams.get('from_auth') === 'true';

    // 인증 파라미터가 있으면 URL에서 제거
    if (fromAuth) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // URL에서 코드 확인 및 처리
    this.checkAuthCode();

    // 저장된 코드가 있는지 확인
    const storedCode = localStorage.getItem('spotify_code');
    if (storedCode) {
      console.log('저장된 인증 코드 발견. 토큰 교환 시도...');
      try {
        // spotifyAPI의 메서드 호출
        const success = await spotifyAPI.checkAndProcessAuthCode();
        if (success) {
          console.log('저장된 코드로 토큰 교환 성공!');
          this.updateUIAfterAuth();
        }
      } catch (error) {
        console.error('저장된 코드 처리 오류:', error);
      }
    }

    // 인증 상태 확인
    const isAuthenticated = await spotifyAPI.isAuthenticated();
    if (
      isAuthenticated &&
      (fromAuth || document.referrer.includes('callback'))
    ) {
      console.log('인증 후 돌아왔거나 새로고침됨. 이전 검색 복원 시도...');
      await this.restoreLastSearch();
    }

    // 콘솔에서 검색할 수 있는 메서드 노출
    (window as any).searchFromConsole = async (query: string) => {
      if (query) {
        await this.searchTrack(query);
      }
    };

    console.log(
      `Spotify 인증 상태: ${isAuthenticated ? '로그인됨' : '로그인 필요'}`,
    );

    console.log('Spotify 검색 컴포넌트가 초기화되었습니다.');
  }

  /**
   * 검색 입력 필드 렌더링 - 사용하지 않음
   */
  private renderSearchInput(): void {
    // 검색 입력 UI를 렌더링하지 않음
    // 이 메서드는 더 이상 initialize()에서 호출되지 않음
  }

  /**
   * 트랙 검색
   */
  private async searchTrack(query: string): Promise<void> {
    try {
      console.log(`검색 시작: "${query}"`);
      // 검색 전에 토큰 유효성 확인
      if (this.isTokenExpired()) {
        const refreshSuccess = await this.refreshToken();
        if (!refreshSuccess) {
          console.log(
            '토큰이 만료되었지만 갱신에 실패했습니다. 기본 검색 API를 사용합니다.',
          );
        } else {
          console.log('토큰 갱신 성공. 검색을 계속합니다.');
        }
      }

      // 검색어 형식 검증
      const parts = query.split(' ');
      if (parts.length < 2) {
        this.showError('검색어 형식은 "가수이름 노래제목" 입니다.');
        return;
      }

      // Spotify API로 검색
      console.log('Spotify API 호출 중...');
      const result = await spotifyAPI.searchTrack(query);

      if (!result) {
        this.showError('검색 중 오류가 발생했습니다.');
        return;
      }

      if (!result.tracks || result.tracks.items.length === 0) {
        this.showError('검색 결과가 없습니다.');
        return;
      }

      console.log(`검색 결과: ${result.tracks.items.length}개의 트랙 찾음`);

      // 기존 MusicCard가 있다면 제거
      if (this.musicCard) {
        this.musicCard.destroy();
        this.musicCard = null;
      }

      // 결과 컨테이너 초기화
      this.resultsContainer.innerHTML = '';

      // 첫 번째 트랙 가져오기
      const track = result.tracks.items[0];
      console.log('선택된 트랙:', {
        name: track.name,
        artist: track.artists[0].name,
        has_preview: !!track.preview_url,
      });

      // 검색 정보 저장 (추가된 부분)
      this.saveSearchInfo(query, track);

      // MusicCard 생성
      this.musicCard = new MusicCard(this.resultsContainer, track, {
        onPlay: async previewUrl => {
          // 미리듣기 URL이 있다면 바로 재생
          console.log('재생 요청:', { has_preview: !!previewUrl });

          if (previewUrl) {
            const audio = new Audio(previewUrl);
            audio
              .play()
              .then(() => console.log('미리듣기 재생 시작'))
              .catch(err => console.error('미리듣기 재생 실패:', err));
          } else {
            // 미리듣기 URL이 없으면 사용자 인증 상태 확인
            const isAuthenticated = await spotifyAPI.isAuthenticated();
            console.log(
              'Spotify 인증 상태:',
              isAuthenticated ? '로그인됨' : '로그인 필요',
            );

            if (isAuthenticated) {
              // 사용자에게 spotify 앱 실행 안내
              alert(
                '재생하려면 Spotify 앱이 실행 중이어야 합니다. Spotify 앱을 실행한 후 다시 시도해주세요.',
              );

              // 재생 시도
              console.log('Spotify 앱으로 재생 시도...');
              const success = await spotifyAPI.playTrack(
                `spotify:track:${track.id}`,
              );

              if (!success) {
                this.showError(
                  '재생에 실패했습니다. Spotify 앱이 실행 중인지 확인해주세요.',
                );
              }
            } else {
              // 로컬 스토리지에서 토큰이 있는지 직접 확인
              const accessToken = localStorage.getItem('spotify_access_token');

              if (accessToken) {
                console.log('토큰 갱신 시도...');
                const refreshSuccess = await this.refreshToken();

                if (refreshSuccess) {
                  console.log('토큰 갱신 성공. 재생을 다시 시도합니다.');
                  alert(
                    '재생하려면 Spotify 앱이 실행 중이어야 합니다. Spotify 앱을 실행한 후 다시 시도해주세요.',
                  );

                  // 재생 재시도
                  const success = await spotifyAPI.playTrack(
                    `spotify:track:${track.id}`,
                  );
                  if (!success) {
                    this.showError(
                      '재생에 실패했습니다. Spotify 앱이 실행 중인지 확인해주세요.',
                    );
                  }
                  return;
                }
              }

              // 로그인이 필요하다는 메시지 표시
              this.showLoginMessage();
              console.log('Spotify 로그인 필요 메시지 표시됨');
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
   * 검색 정보 저장
   */
  private saveSearchInfo(query: string, track: SpotifyTrack): void {
    if (!query || !track) return;

    const searchInfo = {
      query: query,
      track: track,
      timestamp: Date.now(),
    };

    localStorage.setItem('spotify_last_search', JSON.stringify(searchInfo));
    console.log('검색 정보 저장됨:', query);
  }

  /**
   * 저장된 검색 정보 복원
   */
  private async restoreLastSearch(): Promise<boolean> {
    const savedSearch = localStorage.getItem('spotify_last_search');
    if (!savedSearch) return false;

    try {
      const searchInfo = JSON.parse(savedSearch);
      // 최대 30분까지만 검색 정보 유지 (1800000ms = 30분)
      if (Date.now() - searchInfo.timestamp > 1800000) {
        localStorage.removeItem('spotify_last_search');
        return false;
      }

      console.log('이전 검색 정보 복원:', searchInfo.query);

      // 검색 결과가 있으면 MusicCard 생성
      if (searchInfo.track) {
        // 기존 MusicCard가 있다면 제거
        if (this.musicCard) {
          this.musicCard.destroy();
          this.musicCard = null;
        }

        // 결과 컨테이너 초기화
        this.resultsContainer.innerHTML = '';

        // MusicCard 생성
        this.musicCard = new MusicCard(
          this.resultsContainer,
          searchInfo.track,
          {
            onPlay: async previewUrl => {
              // 미리듣기 URL이 있다면 바로 재생
              console.log('재생 요청:', { has_preview: !!previewUrl });

              if (previewUrl) {
                const audio = new Audio(previewUrl);
                audio
                  .play()
                  .then(() => console.log('미리듣기 재생 시작'))
                  .catch(err => console.error('미리듣기 재생 실패:', err));
              } else {
                // 미리듣기 URL이 없으면 사용자 인증 상태 확인
                const isAuthenticated = await spotifyAPI.isAuthenticated();

                if (isAuthenticated) {
                  // 재생 시도
                  const success = await spotifyAPI.playTrack(
                    `spotify:track:${searchInfo.track.id}`,
                  );
                  if (!success) {
                    this.showError(
                      '재생에 실패했습니다. Spotify 앱이 실행 중인지 확인해주세요.',
                    );
                  }
                } else {
                  // 로그인이 필요하다는 메시지 표시
                  this.showLoginMessage();
                }
              }
            },
          },
        );

        // 트랙 선택 콜백 호출
        if (this.options.onTrackSelected) {
          this.options.onTrackSelected(searchInfo.track);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('검색 정보 복원 오류:', error);
      localStorage.removeItem('spotify_last_search');
      return false;
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
        console.log('Spotify 로그인 시작');
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
        console.log('로그인 취소 및 이전 화면으로 복귀');
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

  /**
   * 컴포넌트 제거
   */
  destroy(): void {
    if (this.musicCard) {
      this.musicCard.destroy();
    }
    this.container.innerHTML = '';
    console.log('SpotifySearch 컴포넌트가 제거됨');
  }
}
