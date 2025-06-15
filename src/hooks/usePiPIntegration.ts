
import { usePiPVideo } from '@/contexts/PiPVideoContext';

export function usePiPIntegration() {
  const { openPiP, closePiP, pipState } = usePiPVideo();

  const openVideoInPiP = (videoUrl: string, title: string) => {
    if (videoUrl && title) {
      openPiP(videoUrl, title);
    }
  };

  const isVideoInPiP = (videoUrl: string) => {
    return pipState.isOpen && pipState.videoUrl === videoUrl;
  };

  return {
    openVideoInPiP,
    closePiP,
    isVideoInPiP,
    isPiPOpen: pipState.isOpen
  };
}
