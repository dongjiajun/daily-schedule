import { screenWidth, screenHeight } from './render';

let nextId = 0;

export default class FallingItem {
  constructor(speed) {
    this.id = nextId += 1;
    this.radius = 14 + Math.random() * 6;
    this.x = this.radius + Math.random() * (screenWidth - this.radius * 2);
    this.y = -this.radius;
    this.speed = speed;
    this.type = Math.random() < 0.78 ? 'star' : 'bomb';
    this.rotation = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.08;
    this.active = true;
  }

  update() {
    this.y += this.speed;
    this.rotation += this.spin;
    if (this.y - this.radius > screenHeight + 20) {
      this.active = false;
    }
  }

  render(context) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.rotation);

    if (this.type === 'star') {
      this.drawStar(context);
    } else {
      this.drawBomb(context);
    }

    context.restore();
  }

  drawStar(context) {
    const spikes = 5;
    const outer = this.radius;
    const inner = this.radius * 0.45;

    context.beginPath();
    for (let i = 0; i < spikes * 2; i += 1) {
      const r = i % 2 === 0 ? outer : inner;
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.closePath();
    context.fillStyle = '#fde047';
    context.shadowColor = 'rgba(253, 224, 71, 0.6)';
    context.shadowBlur = 10;
    context.fill();
  }

  drawBomb(context) {
    context.beginPath();
    context.arc(0, 0, this.radius, 0, Math.PI * 2);
    context.fillStyle = '#475569';
    context.fill();

    context.beginPath();
    context.moveTo(0, -this.radius);
    context.quadraticCurveTo(this.radius * 0.6, -this.radius * 1.6, this.radius * 0.3, -this.radius * 1.9);
    context.strokeStyle = '#94a3b8';
    context.lineWidth = 3;
    context.stroke();

    context.beginPath();
    context.arc(this.radius * 0.35, -this.radius * 1.85, 4, 0, Math.PI * 2);
    context.fillStyle = '#f97316';
    context.fill();
  }

  hits(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const halfW = player.width / 2 + this.radius * 0.6;
    const halfH = player.height / 2 + this.radius * 0.6;
    return Math.abs(dx) < halfW && Math.abs(dy) < halfH;
  }

  isStar() {
    return this.type === 'star';
  }

  isBomb() {
    return this.type === 'bomb';
  }
}
