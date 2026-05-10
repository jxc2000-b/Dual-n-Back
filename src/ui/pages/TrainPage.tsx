import { Grid } from '@ui/components/Grid';
import { HotkeyButtons } from '@ui/components/HotkeyButtons';
import { SidePanel } from '@ui/components/SidePanel';
import './TrainPage.css';

// SKELETON — wire together useGameSession + LetterPlayer + storage.appendSet on
// finish + global keydown for A/L. See PLAN.md → "UI / Pages / Train".
//
// Not yet wired:
//   - Start/Cancel button -> session.start / session.cancel
//   - When session.state.stimVisible: pass activeCell to <Grid>, call
//     letterPlayer.play(currentTrial.letter) once on transition into stim.
//   - On 'finished': call storage.appendSet, refresh side panel data.
//   - Show <Toast> when N changes (config.n delta vs previous set).

export function TrainPage() {
  return (
    <div className="train-page">
      <section className="train-page__main">
        <header className="train-page__bar">
          <span className="train-page__counter">0 of 24</span>
          {/* TODO(ui-agent): Start/Cancel button — amber when running, teal when idle. */}
          <button className="train-page__start" type="button">Start</button>
        </header>

        <Grid activeCell={null} />

        <HotkeyButtons
          onPosition={() => { /* TODO(ui-agent) */ }}
          onAudio={() => { /* TODO(ui-agent) */ }}
        />
      </section>

      <SidePanel />
    </div>
  );
}
