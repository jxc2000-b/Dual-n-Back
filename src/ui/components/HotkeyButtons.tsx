import './HotkeyButtons.css';

// SKELETON — wire to onPress callbacks; press feedback (200ms tint) when active.
// UI agent: also wire global keydown ('a' and 'l') in TrainPage.

export interface HotkeyButtonsProps {
  onPosition: () => void;
  onAudio: () => void;
  positionPressed?: boolean;
  audioPressed?: boolean;
  positionFeedback?: 'correct' | 'incorrect' | null;
  audioFeedback?: 'correct' | 'incorrect' | null;
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
        className={[
          'hotkey',
          positionPressed ? 'hotkey--pressed' : '',
          positionFeedback ? `hotkey--${positionFeedback}` : '',
        ].filter(Boolean).join(' ')}
        onClick={onPosition}
      >
        A: Position
      </button>
      <button
        type="button"
        className={[
          'hotkey',
          audioPressed ? 'hotkey--pressed' : '',
          audioFeedback ? `hotkey--${audioFeedback}` : '',
        ].filter(Boolean).join(' ')}
        onClick={onAudio}
      >
        L: Audio
      </button>
    </div>
  );
}
