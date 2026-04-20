export interface VideoPlayerControlDescriptor {
  id: 'next' | 'report' | 'refresh' | 'lights' | 'theater';
  label: string;
  disabled?: boolean;
}

export interface VideoPlayerControlState {
  hasNext: boolean;
  hasReportedCurrentMirror: boolean;
}

export function buildVideoPlayerControls(
  state: VideoPlayerControlState,
): VideoPlayerControlDescriptor[] {
  const controls: VideoPlayerControlDescriptor[] = [];

  if (state.hasNext) {
    controls.push({ id: 'next', label: 'Episode berikutnya' });
  }

  controls.push({
    id: 'report',
    label: 'Laporkan sumber',
    disabled: state.hasReportedCurrentMirror,
  });
  controls.push({ id: 'refresh', label: 'Muat ulang pemutar' });
  controls.push({ id: 'lights', label: 'Redupkan lampu' });
  controls.push({ id: 'theater', label: 'Mode teater' });

  return controls;
}
