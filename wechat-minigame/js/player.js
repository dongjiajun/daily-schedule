import { screenWidth, screenHeight } from './render';

const PADDLE_WIDTH = 88;
const PADDLE_HEIGHT = 18;
const BOTTOM_MARGIN = 48;

export default class Player {
  x = screenWidth / 2;

  y = screenHeight - BOTTOM_MARGIN;

  width = PADDLE_WIDTH;

  height = PADDLE_HEIGHT;

  init() {
    this.x = screenWidth / 2;
    this.y = screenHeight - BOTTOM_MARGIN;
  }

  bindTouch() {
    wx.onTouchStart((e) => this.moveToTouch(e));
    wx.onTouchMove((e) => this.moveToTouch(e));
  }

  moveToTouch(e) {
    const touch = e.touches[0];
    if (!touch) return;
    this.x = Math.max(
      this.width / 2,
      Math.min(screenWidth - this.width / 2, touch.clientX),
    );
  }

  render(context) {
    const left = this.x - this.width / 2;
    const top = this.y - this.height / 2;

    const gradient = context.createLinearGradient(left, top, left, top + this.height);
    gradient.addColorStop(0, '#7dd3fc');
    gradient.addColorStop(1, '#38bdf8');

    context.save();
    context.fillStyle = gradient;
    context.shadowColor = 'rgba(56, 189, 248, 0.45)';
    context.shadowBlur = 12;
    context.fillRect(left, top, this.width, this.height);
    context.restore();
  }
}
