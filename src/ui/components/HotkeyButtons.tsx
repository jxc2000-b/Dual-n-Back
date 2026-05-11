import './HotkeyButtons.css';

export type Feedback = 'correct' | 'incorrect' | null | undefined;

export interface HotkeyButtonsProps {
  onPosition: () => void;
  onAudio: () => void;
  positionPressed?: boolean;
  audioPressed?: boolean;
  positionFeedback?: Feedback;
  audioFeedback?: Feedback;
}

function classes(
  pressed: boolean | undefined,
  feedback: Feedback,
): string {
  return [
    'hotkey',
    pressed ? 'hotkey--pressed' : '',
    feedback === 'correct' ? 'hotkey--correct' : '',
    feedback === 'incorrect' ? 'hotkey--incorrect' : '',
  ].filter(Boolean).join(' ');
}

export function HotkeyButtons({
  onPosition,
  onAudio,
  positionPressed,
  audioPressed,
  positionFeedback,
  audioFeedback,
}: HotkeyButtonsProps) {
  return (
    <div className="hotkeys">
      <button
        type="button"
        className={classes(positionPressed, positionFeedback)}
        onClick={onPosition}
      >
        A: Position
      </button>
      <button
        type="button"
        className={classes(audioPressed, audioFeedback)}
        onClick={onAudio}
      >
        L: Audio
      </button>
    </div>
  );
}
