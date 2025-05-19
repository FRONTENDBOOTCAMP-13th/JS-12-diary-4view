// utils/spotify.ts
/*Spotify API와의 통신을 담당하는 유틸리티 클래스 */

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
//2. OAuth 인증 처리
//3. Spotify API와의 통신
//4. 인증 상태 확인 및 로그아웃
