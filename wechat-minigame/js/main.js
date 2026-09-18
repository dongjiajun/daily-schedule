import DataBus from './databus';
import Player from './player';
import FallingItem from './falling-item';
import Hud from './hud';
import { ctx, screenWidth, screenHeight } from './render';

const SPAWN_INTERVAL = 42;

export default class Main {
  databus = new DataBus();

  player = new Player();

  hud = new Hud();

  items = [];

  aniId = 0;

  constructor() {
    GameGlobal.databus = this.databus;
    this.hud.onRestart = () => this.start();
    this.hud.bindRestart();
    this.player.bindTouch();
    this.start();
  }

  start() {
    this.databus.reset();
    this.items = [];
    this.player.init();
    if (this.aniId) {
      cancelAnimationFrame(this.aniId);
    }
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  get fallSpeed() {
    return 2.8 + Math.min(this.databus.score / 120, 4);
  }

  spawnItem() {
    if (this.databus.frame % SPAWN_INTERVAL === 0) {
      this.items.push(new FallingItem(this.fallSpeed));
    }
  }

  updateItems() {
    this.items.forEach((item) => item.update());
    this.items = this.items.filter((item) => item.active);
  }

  handleCollisions() {
    this.items.forEach((item) => {
      if (!item.active || !item.hits(this.player)) return;

      item.active = false;
      if (item.isStar()) {
        this.databus.score += 10;
        wx.vibrateShort({ type: 'light' });
      } else if (item.isBomb()) {
        this.databus.lives -= 1;
        wx.vibrateShort({ type: 'heavy' });
        if (this.databus.lives <= 0) {
          this.databus.isGameOver = true;
        }
      }
    });
  }

  update() {
    if (this.databus.isGameOver) return;

    this.databus.frame += 1;
    this.spawnItem();
    this.updateItems();
    this.handleCollisions();
  }

  drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, screenHeight);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e3a5f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 24; i += 1) {
      const x = (i * 47) % screenWidth;
      const y = ((i * 83) + this.databus.frame * 0.3) % screenHeight;
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  render() {
    this.drawBackground();
    this.player.render(ctx);
    this.items.forEach((item) => item.render(ctx));
    this.hud.render(ctx, this.databus);
  }

  loop() {
    this.update();
    this.render();
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}
