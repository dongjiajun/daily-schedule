import { screenWidth, screenHeight } from './render';

export default class Hud {
  onRestart = null;

  restartButton = null;

  render(context, databus) {
    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.92)';
    context.font = '600 18px sans-serif';
    context.textAlign = 'left';
    context.fillText(`得分 ${databus.score}`, 20, 36);

    context.textAlign = 'right';
    context.fillText(`生命 ${databus.lives}`, screenWidth - 20, 36);
    context.restore();

    if (!databus.isGameOver) {
      this.restartButton = null;
      return;
    }

    this.renderGameOver(context, databus);
  }

  renderGameOver(context, databus) {
    context.save();
    context.fillStyle = 'rgba(15, 23, 42, 0.72)';
    context.fillRect(0, 0, screenWidth, screenHeight);

    const panelW = screenWidth * 0.78;
    const panelH = 220;
    const panelX = (screenWidth - panelW) / 2;
    const panelY = (screenHeight - panelH) / 2;

    context.fillStyle = '#1e293b';
    context.fillRect(panelX, panelY, panelW, panelH);

    context.fillStyle = '#f8fafc';
    context.font = '700 26px sans-serif';
    context.textAlign = 'center';
    context.fillText('游戏结束', screenWidth / 2, panelY + 58);

    context.fillStyle = '#94a3b8';
    context.font = '16px sans-serif';
    context.fillText(`最终得分：${databus.score}`, screenWidth / 2, panelY + 98);

    const btnW = 160;
    const btnH = 44;
    const btnX = (screenWidth - btnW) / 2;
    const btnY = panelY + panelH - 72;

    context.fillStyle = '#38bdf8';
    context.fillRect(btnX, btnY, btnW, btnH);

    context.fillStyle = '#0f172a';
    context.font = '600 17px sans-serif';
    context.fillText('再来一局', screenWidth / 2, btnY + 29);

    this.restartButton = { x: btnX, y: btnY, width: btnW, height: btnH };
    context.restore();
  }

  bindRestart() {
    wx.onTouchStart((e) => {
      if (!this.restartButton || !this.onRestart) return;
      const touch = e.touches[0];
      if (!touch) return;
      const { x, y, width, height } = this.restartButton;
      if (
        touch.clientX >= x
        && touch.clientX <= x + width
        && touch.clientY >= y
        && touch.clientY <= y + height
      ) {
        this.onRestart();
      }
    });
  }
}
