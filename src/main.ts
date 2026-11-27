import './styles.css';
import { GameApp } from '@engine/game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const screenWrap = document.getElementById('screen-wrap') as HTMLElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;
const btnImport = document.getElementById('btn-import') as HTMLButtonElement;
const fileImport = document.getElementById('file-import') as HTMLInputElement;
const saveBanner = document.getElementById('save-banner') as HTMLElement;
const btnMute = document.getElementById('btn-mute') as HTMLButtonElement;
const btnCrt = document.getElementById('btn-crt') as HTMLButtonElement;
const btnHelp = document.getElementById('btn-help') as HTMLButtonElement;
const btnCloseHelp = document.getElementById('btn-close-help') as HTMLButtonElement;
const helpModal = document.getElementById('help-modal') as HTMLElement;

let crtOn = true;
let muted = false;
let bannerTimer: number | null = null;

const showSaveBanner = (msg: string) => {
  saveBanner.textContent = msg;
  saveBanner.classList.remove('hidden');
  if (bannerTimer !== null) window.clearTimeout(bannerTimer);
  bannerTimer = window.setTimeout(() => {
    saveBanner.classList.add('hidden');
  }, 3200);
};

const syncUi = (nextCrt: boolean, nextMuted: boolean, hasActiveState: boolean) => {
  crtOn = nextCrt;
  muted = nextMuted;
  screenWrap.classList.toggle('crt-on', crtOn);
  btnCrt.textContent = `📺 CRT: ${crtOn ? 'ON' : 'OFF'}`;
  btnMute.textContent = muted ? '🔇 Audio: MUTED' : '🔊 Audio: ON';
  btnSave.disabled = !hasActiveState;
  btnExport.disabled = !hasActiveState;
};

const app = new GameApp(canvas, syncUi);
app.start();

btnSave.addEventListener('click', () => {
  app.audio.unlock();
  if (app.quickSave()) {
    showSaveBanner('Saved progress to Auto-Save & Slot 1 in this browser!');
  } else {
    showSaveBanner('Could not write to browser storage—use Export Save (.json) instead.');
  }
});

btnExport.addEventListener('click', () => {
  app.audio.unlock();
  const payload = app.exportCurrentSave();
  if (!payload) return;
  const blob = new Blob([payload.json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = payload.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showSaveBanner(`Exported portable save: ${payload.filename}`);
});

btnImport.addEventListener('click', () => {
  app.audio.unlock();
  fileImport.value = '';
  fileImport.click();
});

fileImport.addEventListener('change', async () => {
  const file = fileImport.files?.[0];
  if (!file) return;
  try {
    const raw = await file.text();
    if (app.importSaveFile(raw)) {
      showSaveBanner(`Loaded save file: ${file.name}!`);
    } else {
      showSaveBanner('Invalid or corrupted save file (.json).');
    }
  } catch {
    showSaveBanner('Failed to read save file.');
  }
});

btnMute.addEventListener('click', () => {
  app.audio.unlock();
  app.applyMuteSetting(!muted);
});

btnCrt.addEventListener('click', () => {
  app.applyCrtSetting(!crtOn);
});

btnHelp.addEventListener('click', () => {
  helpModal.classList.remove('hidden');
});

btnCloseHelp.addEventListener('click', () => {
  helpModal.classList.add('hidden');
});

helpModal.addEventListener('click', (e) => {
  if (e.target === helpModal) {
    helpModal.classList.add('hidden');
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') {
    app.audio.unlock();
    app.applyMuteSetting(!muted);
  }
});
