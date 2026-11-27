export type ActionKey =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'confirm'
  | 'cancel'
  | 'skill'
  | 'swapNext'
  | 'swapPrev';

const KEY_MAP: Record<string, ActionKey> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  KeyZ: 'confirm',
  Enter: 'confirm',
  KeyX: 'cancel',
  Escape: 'cancel',
  Backspace: 'cancel',
  KeyC: 'skill',
  Space: 'skill',
  Tab: 'swapNext',
  KeyE: 'swapNext',
  KeyQ: 'swapPrev',
};

export class InputManager {
  private held = new Set<ActionKey>();
  private pressed = new Set<ActionKey>();
  private onFirstGesture?: () => void;
  private gestureFired = false;

  constructor(onFirstGesture?: () => void) {
    this.onFirstGesture = onFirstGesture;
    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp);
    this.bindVirtualButtons();
  }

  private fireGesture() {
    if (!this.gestureFired) {
      this.gestureFired = true;
      this.onFirstGesture?.();
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    this.fireGesture();
    if (!this.held.has(action)) {
      this.pressed.add(action);
    }
    this.held.add(action);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    this.held.delete(action);
  };

  private bindVirtualButtons() {
    const buttons = document.querySelectorAll<HTMLElement>('[data-key]');
    buttons.forEach((btn) => {
      const key = btn.dataset.key as ActionKey | undefined;
      if (!key) return;
      const press = (ev: Event) => {
        ev.preventDefault();
        this.fireGesture();
        if (!this.held.has(key)) this.pressed.add(key);
        this.held.add(key);
        btn.classList.add('pressed');
      };
      const release = (ev: Event) => {
        ev.preventDefault();
        this.held.delete(key);
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', release);
      btn.addEventListener('pointercancel', release);
    });
  }

  isHeld(action: ActionKey): boolean {
    return this.held.has(action);
  }

  justPressed(action: ActionKey): boolean {
    return this.pressed.has(action);
  }

  consume(action: ActionKey): boolean {
    if (this.pressed.has(action)) {
      this.pressed.delete(action);
      return true;
    }
    return false;
  }

  endFrame(): void {
    this.pressed.clear();
  }
}
