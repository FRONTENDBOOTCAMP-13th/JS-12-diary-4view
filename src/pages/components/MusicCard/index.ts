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
  private render(): void {}
}
