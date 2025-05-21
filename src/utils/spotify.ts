// utils/spotify.ts
/*Spotify API와의 통신을 담당하는 유틸리티 클래스 */
import { generateRandomString } from './utils';

// 인터페이스 정의
export interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  preview_url: string | null;
}

//1. 클라이언트 ID와 클라이언트 시크릿 관리
// Spotify API 클래스
export class SpotifyAPI {
  private clientId: string; // 클라이언트 ID
  private clientSecret: string; // 클라이언트 시크릿
  private redirectUri: string;

  // 사용자 인증 토큰 (재생 기능에 필요)
  private userToken: string | null = null;
  private userTokenExpiry: number = 0;
  private refreshToken: string | null = null;

  // 앱 인증 토큰 (검색 기능에 필요)
  private appToken: string | null = null;
  private appTokenExpiry: number = 0;

  private codeVerifier: string | null = null;

  constructor() {
    // Vite 환경변수에서 클라이언트 ID와 시크릿 가져오기
    this.clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    this.clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
    this.redirectUri = import.meta.env.VITE_CALLBACK_URI;

    // 저장된 토큰 로드
    this.loadTokenFromStorage();
  }

  /**
   * 인증 URL 생성 및 인증 시작
   */
  //2. OAuth 인증 처리
  async initiateLogin(): Promise<void> {
    // 코드 검증기 생성 (PKCE 인증 플로우용)
    this.codeVerifier = generateRandomString(64);

    // 로컬 스토리지에 코드 검증기 저장
    localStorage.setItem('spotify_code_verifier', this.codeVerifier);

    // 코드 챌린지 생성
    const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);

    // 인증 URL 생성 및 리다이렉트
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope:
        'user-read-private user-read-email streaming user-modify-playback-state user-read-playback-state',
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * 콜백 처리 - 인증 코드를 액세스 토큰으로 교환
   */
  async handleCallback(): Promise<boolean> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      console.error('인증 오류:', error);
      return false;
    }

    if (!code) {
      console.error('인증 코드가 없습니다.');
      return false;
    }

    // 로컬 스토리지에서 코드 검증기 가져오기
    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    if (!codeVerifier) {
      console.error('코드 검증기를 찾을 수 없습니다.');
      return false;
    }

    try {
      // 인증 코드를 액세스 토큰으로 교환
      const tokenResponse = await fetch(
        'https://accounts.spotify.com/api/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: this.clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.redirectUri,
            code_verifier: codeVerifier,
          }).toString(),
        },
      );

      if (!tokenResponse.ok) {
        throw new Error('액세스 토큰 획득 실패');
      }

      const data: SpotifyToken = await tokenResponse.json();

      // 토큰 저장
      this.userToken = data.access_token;
      this.userTokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // 안전을 위해 1분 빼기

      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }

      // 로컬 스토리지에 토큰 저장
      this.saveUserTokenToStorage();

      return true;
    } catch (error) {
      console.error('토큰 교환 오류:', error);
      return false;
    }
  }
  /**
   * 인증 콜백에서 받은 코드를 처리하고 토큰으로 교환
   */
  async checkAndProcessAuthCode(): Promise<boolean> {
    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // URL에 코드가 없으면 로컬 스토리지에서 확인
    const storedCode = localStorage.getItem('spotify_code');
    const codeToUse = code || storedCode;

    const error = urlParams.get('error');

    console.log('코드 처리 검사:', {
      code: codeToUse ? `${codeToUse.substring(0, 10)}...` : null,
      error,
    });

    if (error) {
      console.error('Spotify 인증 오류:', error);
      return false;
    }

    if (!codeToUse) {
      return false;
    }

    try {
      // 로컬 스토리지에서 코드 검증기 가져오기
      const codeVerifier = localStorage.getItem('spotify_code_verifier');
      if (!codeVerifier) {
        console.error('코드 검증기를 찾을 수 없습니다');
        return false;
      }

      // 토큰 교환 요청
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          grant_type: 'authorization_code',
          code: codeToUse,
          redirect_uri: this.redirectUri,
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
      console.log('토큰 교환 성공!');

      // 토큰 저장 - 일관된 키 이름 사용
      this.userToken = tokenData.access_token;
      localStorage.setItem('spotify_access_token', tokenData.access_token);

      const expiryTime = Date.now() + tokenData.expires_in * 1000 - 60000;
      this.userTokenExpiry = expiryTime;
      localStorage.setItem('spotify_token_expiry', String(expiryTime));

      if (tokenData.refresh_token) {
        this.refreshToken = tokenData.refresh_token;
        localStorage.setItem('spotify_refresh_token', tokenData.refresh_token);
      }

      // 처리된 코드 삭제
      localStorage.removeItem('spotify_code');

      // URL에서 코드 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname);

      return true;
    } catch (error) {
      console.error('토큰 교환 오류:', error);
      return false;
    }
  }

  /**
   * 사용자 토큰을 로컬 스토리지에 저장
   */
  private saveUserTokenToStorage(): void {
    localStorage.setItem('spotify_user_token', this.userToken!);
    localStorage.setItem(
      'spotify_user_token_expiry',
      this.userTokenExpiry.toString(),
    );

    if (this.refreshToken) {
      localStorage.setItem('spotify_refresh_token', this.refreshToken);
    }
  }

  /**
   * 로컬 스토리지에서 토큰 불러오기
   */
  private loadTokenFromStorage(): void {
    // 사용자 토큰 로드
    const userToken = localStorage.getItem('spotify_user_token');
    const userExpiry = localStorage.getItem('spotify_user_token_expiry');
    const refreshToken = localStorage.getItem('spotify_refresh_token');

    if (userToken && userExpiry) {
      this.userToken = userToken;
      this.userTokenExpiry = parseInt(userExpiry, 10);

      if (refreshToken) {
        this.refreshToken = refreshToken;
      }
    }
  }

  /**
   * 사용자 액세스 토큰 갱신
   */
  private async refreshUserToken(): Promise<boolean> {
    if (!this.refreshToken) {
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
          refresh_token: this.refreshToken,
          client_id: this.clientId,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error('토큰 갱신 실패');
      }

      const data: SpotifyToken = await response.json();

      this.userToken = data.access_token;
      this.userTokenExpiry = Date.now() + data.expires_in * 1000 - 60000;

      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }

      this.saveUserTokenToStorage();
      return true;
    } catch (error) {
      console.error('토큰 갱신 오류:', error);
      return false;
    }
  }

  /**
   * 앱 액세스 토큰 획득 (Client Credentials 방식)
   */
  private async getAppToken(): Promise<string | null> {
    const now = Date.now();

    // 토큰 유효성 검사
    if (this.appToken && now < this.appTokenExpiry) {
      return this.appToken;
    }

    try {
      // 새 토큰 요청
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error('앱 토큰 획득 실패');
      }

      const data: SpotifyToken = await response.json();
      this.appToken = data.access_token;
      this.appTokenExpiry = now + data.expires_in * 1000 - 60000; // 안전을 위해 1분 빼기

      return this.appToken;
    } catch (error) {
      console.error('앱 토큰 획득 오류:', error);
      return null;
    }
  }

  /**
   * 유효한 사용자 토큰 가져오기
   */
  private async getValidUserToken(): Promise<string | null> {
    const now = Date.now();

    // 토큰 유효성 검사
    if (this.userToken && now < this.userTokenExpiry) {
      return this.userToken;
    }

    // 토큰 갱신 시도
    if (await this.refreshUserToken()) {
      return this.userToken;
    }

    // 유효한 토큰 없음
    return null;
  }

  /**
   * SHA-256 코드 챌린지 생성
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
  //3. Spotify API와의 통신
  /**
   * 사용자 인증 상태 확인
   */
  async isAuthenticated(): Promise<boolean> {
    console.log('인증 상태 확인 중...');

    // 다양한 가능한 토큰 키 검사
    const userToken =
      localStorage.getItem('spotify_access_token') ||
      localStorage.getItem('spotify_user_token');

    console.log('토큰 존재 여부:', !!userToken);

    if (!userToken) {
      return false;
    }

    // 토큰 만료 시간 확인
    const expiryTime =
      localStorage.getItem('spotify_token_expiry') ||
      localStorage.getItem('spotify_user_token_expiry');

    if (expiryTime && parseInt(expiryTime, 10) < Date.now()) {
      console.log('토큰이 만료되었습니다. 갱신 시도...');
      return await this.refreshUserToken();
    }

    // 토큰이 있고 만료되지 않았다면 인증됨
    return true;
  }

  /**
   * 트랙 검색 (로그인 불필요)
   */
  async searchTrack(query: string): Promise<SpotifySearchResult | null> {
    try {
      // 쿼리 파싱 (가수이름 + 노래제목)
      const parts = query.split(' ');
      if (parts.length < 2) {
        throw new Error('검색어 형식은 "가수이름 노래제목" 입니다.');
      }

      const artistName = parts[0];
      const trackName = parts.slice(1).join(' ');

      // 앱 토큰 가져오기 (Client Credentials)
      const token = await this.getAppToken();
      if (!token) {
        throw new Error('API 토큰을 가져올 수 없습니다.');
      }

      // 트랙 검색
      const searchQuery = `artist:${encodeURIComponent(artistName)} track:${encodeURIComponent(trackName)}`;
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Spotify 검색 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('트랙 검색 오류:', error);
      return null;
    }
  }
  /**
   * 미리 듣기 URL이 없는 경우 재생 API를 통한 재생 (로그인 필요)
   */
  async playTrack(trackUri: string): Promise<boolean> {
    console.log('재생 시도 중:', trackUri);
    // 유효한 사용자 토큰 확인
    const token = await this.getValidUserToken();
    if (!token) {
      console.error('재생하려면 Spotify에 로그인해야 합니다.');
      return false;
    }

    try {
      // 현재 재생 기기 가져오기
      const deviceResponse = await fetch(
        'https://api.spotify.com/v1/me/player/devices',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!deviceResponse.ok) {
        const errorText = await deviceResponse.text();
        console.error(
          '재생 기기를 가져올 수 없습니다:',
          deviceResponse.status,
          errorText,
        );
        throw new Error('재생 기기를 가져올 수 없습니다.');
      }

      const deviceData = await deviceResponse.json();
      console.log('사용 가능한 기기:', deviceData);

      // 활성 기기가 없으면 실패
      if (!deviceData.devices || deviceData.devices.length === 0) {
        console.error('활성화된 Spotify 기기가 없습니다.');
        return false;
      }

      // 첫 번째 활성 기기 선택
      const deviceId = deviceData.devices[0].id;
      console.log('선택된 기기:', deviceId);

      // 트랙 재생 요청
      const playResponse = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [trackUri],
          }),
        },
      );

      return playResponse.ok;
    } catch (error) {
      console.error('재생 오류:', error);
      return false;
    }
  }

  /**
   * 로그아웃
   */
  //4. 인증 상태 확인 및 로그아웃
  logout(): void {
    localStorage.removeItem('spotify_user_token');
    localStorage.removeItem('spotify_user_token_expiry');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_code_verifier');
    this.userToken = null;
    this.userTokenExpiry = 0;
    this.refreshToken = null;
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const spotifyAPI = new SpotifyAPI();
