/* 검색된 트랙을 시각적으로 표시 */
// pages/components/MusicCard/index.ts
import type { SpotifyTrack } from '../../../utils/spotify';
import './style.css';

/* Spotify 트랙 정보를 시각적으로 표시하는 UI 컴포넌트를 구현 */
export class MusicCard {
  private container: HTMLElement;
  private track: SpotifyTrack;
  private onPlayCallback?: (preview_url: string | null) => void;

  /**
   * MusicCard 컴포넌트 생성자
   */
  constructor(
    container: HTMLElement,
    track: SpotifyTrack,
    options?: {
      onPlay?: (preview_url: string | null) => void;
    },
  ) {
    this.container = container;
    this.track = track;
    this.onPlayCallback = options?.onPlay;

    this.render();
  }

  /**
   * 컴포넌트 렌더링
   */
  private render(): void {
    try {
      // 트랙 카드 생성
      const trackCard = document.createElement('div');
      trackCard.className = 'spotify-track-card';

      // 앨범 아트를 배경으로 설정
      if (
        this.track.album &&
        this.track.album.images &&
        this.track.album.images.length > 0
      ) {
        const albumImage = (
          this.track.album.images as { url: string; width: number }[]
        ).reduce((prev, current) =>
          prev.width > current.width ? prev : current,
        );

        trackCard.style.backgroundImage = `url(${albumImage.url})`;
        trackCard.style.backgroundSize = 'cover';
        trackCard.style.backgroundPosition = 'center';
      } else {
        trackCard.style.backgroundColor = 'var(--color-primary)';
      }

      // 텍스트 오버레이 생성
      const overlay = document.createElement('div');
      overlay.className = 'spotify-cover-overlay';

      // 텍스트 컨테이너 생성
      const textContainer = document.createElement('div');

      // 트랙 제목 생성
      const title = document.createElement('h2');
      title.textContent = this.track.name || 'Unknown Track';
      title.className = 'spotify-track-title';

      // 아티스트 생성
      const artist = document.createElement('p');
      artist.textContent = this.track.artists
        ? this.track.artists.map(a => a.name).join(', ')
        : 'Unknown Artist';
      artist.className = 'spotify-track-artist';

      // 텍스트 컨테이너에 제목과 아티스트 추가
      textContainer.appendChild(title);
      textContainer.appendChild(artist);

      // 재생 버튼 생성
      const playButton = document.createElement('button');
      playButton.className = 'spotify-play-button';

      // 재생 버튼에 이벤트 리스너 추가
      playButton.addEventListener('click', () => {
        if (this.onPlayCallback) {
          this.onPlayCallback(this.track.preview_url);
        }
      });

      // 미리듣기가 없는 경우 스타일 변경
      if (!this.track.preview_url) {
        playButton.classList.add('spotify-play-button-login');
        playButton.title = '로그인 후 재생 가능합니다';
      }

      // 오버레이에 텍스트와 버튼 추가
      overlay.appendChild(textContainer);
      overlay.appendChild(playButton);

      // 카드에 오버레이 추가
      trackCard.appendChild(overlay);

      // 카드를 컨테이너에 추가
      this.container.appendChild(trackCard);

      // 애니메이션 효과 추가
      setTimeout(() => {
        trackCard.classList.add('loaded');
      }, 100);
    } catch (error) {
      console.error('Error rendering MusicCard:', error);
    }
  }

  /**
   * 컴포넌트 업데이트
   */
  update(track: SpotifyTrack): void {
    this.track = track;
    this.container.innerHTML = '';
    this.render();
  }

  /**
   * 컴포넌트 제거
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}
