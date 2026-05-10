import './HotkeyButtons.css';

// SKELETON — wire to onPress callbacks; press feedback (200ms tint) when active.
// UI agent: also wire global keydown ('a' and 'l') in TrainPage.

export interface HotkeyButtonsProps {
  onPosition: () => void;
  onAudio: () => void;
  positionPressed?: boolean;
  audioPressed?: boolean;
}

export function HotkeyButtons({
  onPosition,
  onAudio,
  positionPressed,
  audioPressed,
}: HotkeyButtonsProps) {
  return (
    <div className="hotkeys">
      <button
        type="button"
        className={`hotkey${positionPressed ? ' hotkey--pressed' : ''}`}
        onClick={onPosition}
      >
        A: Position
      </button>
      <button
        type="button"
        className={`hotkey${audioPressed ? ' hotkey--pressed' : ''}`}
        onClick={onAudio}
      >
        L: Audio
      </button>
    </div>
  );
}
