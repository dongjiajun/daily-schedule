/**
 * 宠物 SVG 动画层 — OrangeCat / ShibaInu 共享的 CSS 动画定义。
 * 由 `data-action` 属性驱动：idle 呼吸/眨眼、walk 步伐、rest 尾巴慢摆、
 * sleep 蜷缩+Zzz、jump 离地。情绪仍由组件内表情参数控制（正交）。
 */
export const ANIMATION_CSS = `
  /* ── 基底：呼吸 + 眨眼 ── */
  .pet-body { transform-box: fill-box; transform-origin: center bottom; animation: pet-breath 3s ease-in-out infinite; }
  @keyframes pet-breath { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.02); } }
  .pet-eyes { transform-box: fill-box; transform-origin: center; animation: pet-blink 4s infinite; }
  @keyframes pet-blink { 0%, 93%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.12); } }

  /* ── idle 尾巴慢摆 ── */
  .pet-tail { transform-box: fill-box; transform-origin: center; animation: pet-tail-idle 2.5s ease-in-out infinite; }
  @keyframes pet-tail-idle { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } }

  /* ── walk：步伐摆动 + 身体起伏 ── */
  [data-action="walk"] .pet-body { animation: pet-bob 0.4s ease-in-out infinite; }
  @keyframes pet-bob { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
  [data-action="walk"] .pet-leg-l { animation: pet-leg-l 0.4s ease-in-out infinite; }
  @keyframes pet-leg-l { 0%, 100% { transform: translateX(-2px); } 50% { transform: translateX(2px); } }
  [data-action="walk"] .pet-leg-r { animation: pet-leg-r 0.4s ease-in-out infinite; }
  @keyframes pet-leg-r { 0%, 100% { transform: translateX(2px); } 50% { transform: translateX(-2px); } }

  /* ── rest：下坐 + 尾巴慢摆 ── */
  [data-action="rest"] .pet-tail { animation: pet-tail-rest 2s ease-in-out infinite; }
  @keyframes pet-tail-rest { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }

  /* ── sleep：蜷缩 + Zzz 循环 ── */
  [data-action="sleep"] .pet-body { animation: pet-curl 2.5s ease-in-out infinite; }
  @keyframes pet-curl { 0%, 100% { transform: scaleY(0.92); } 50% { transform: scaleY(0.94); } }
  [data-action="sleep"] .pet-eyes { animation: none; }
  .pet-sleep-bubble { opacity: 0; }
  [data-action="sleep"] .pet-sleep-bubble { animation: pet-zzz 2.4s ease-out infinite; }
  @keyframes pet-zzz { 0% { opacity: 0; transform: translate(0, 0); } 20% { opacity: 1; } 100% { opacity: 0; transform: translate(6px, -14px); } }

  /* ── jump：离地 ── */
  [data-action="jump"] .pet-jumpable { animation: pet-jump 0.6s ease-out; }
  @keyframes pet-jump { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } }
`
