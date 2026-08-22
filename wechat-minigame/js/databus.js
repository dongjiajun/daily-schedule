export default class DataBus {
  score = 0;

  lives = 3;

  isGameOver = false;

  frame = 0;

  reset() {
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.frame = 0;
  }
}
