const info = wx.getSystemInfoSync();
const pixelRatio = info.pixelRatio || 1;

export const canvas = wx.createCanvas();
export const ctx = canvas.getContext('2d');

export const screenWidth = info.windowWidth;
export const screenHeight = info.windowHeight;

canvas.width = screenWidth * pixelRatio;
canvas.height = screenHeight * pixelRatio;
ctx.scale(pixelRatio, pixelRatio);
