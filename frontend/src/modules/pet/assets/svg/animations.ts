/**
 * 宠物 SVG 动画层 — OrangeCat / ShibaInu 共享的 CSS 动画定义。
 * 由 `data-action` 属性驱动：idle 呼吸/眨眼、walk 步伐、rest 尾巴慢摆、
 * sleep 蜷缩+Zzz、jump 离地、eat 低头咀嚼、小动作（stretch/yawn/scratch/look）播放一次。
 * 情绪仍由组件内表情参数控制（正交）；情绪切换眨眼过渡由 data-blink 驱动。
 */
export const ANIMATION_CSS = `
  /* ── 基底：呼吸 + 眨眼 ── */
  .pet-body { transform-box: fill-box; transform-origin: center bottom; animation: pet-breath 3s ease-in-out infinite; }
  @keyframes pet-breath { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.02); } }
  .pet-eyes { transform-box: fill-box; transform-origin: center; animation: pet-blink 4s infinite; }
  @keyframes pet-blink { 0%, 93%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.12); } }
  .pet-mouth { transform-box: fill-box; transform-origin: center; }
  .pet-ear-l, .pet-ear-r { transform-box: fill-box; transform-origin: center; }

  /* ── idle 尾巴慢摆 ── */
  .pet-tail { transform-box: fill-box; transform-origin: center; animation: pet-tail-idle 2.5s ease-in-out infinite; }
  @keyframes pet-tail-idle { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } }

  /* ── walk：步伐摆动 + 身体起伏（前倾 5° 基准 ±2° 摆动，均值 -5°） ── */
  [data-action="walk"] .pet-body { animation: pet-bob 0.4s ease-in-out infinite; }
  @keyframes pet-bob { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(-3deg); } }
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

  /* ── eat：低头张嘴咀嚼 + 尾巴快摆 + 耳朵微动（1.5s 由 actionTimer 回 idle） ── */
  [data-action="eat"] .pet-body { animation: pet-eat 1.5s ease-in-out infinite; }
  @keyframes pet-eat { 0%, 15%, 100% { transform: rotate(0deg); } 25%, 85% { transform: rotate(8deg); } }
  [data-action="eat"] .pet-mouth { animation: pet-chew 0.35s ease-in-out infinite; }
  @keyframes pet-chew { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.45); } }
  [data-action="eat"] .pet-tail { animation: pet-tail-fast 0.3s ease-in-out infinite; }
  @keyframes pet-tail-fast { 0%, 100% { transform: rotate(-14deg); } 50% { transform: rotate(14deg); } }
  [data-action="eat"] .pet-ear-l, [data-action="eat"] .pet-ear-r { animation: pet-ear-twitch 0.4s ease-in-out infinite; }
  @keyframes pet-ear-twitch { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }

  /* ── 小动作：播放一次（iteration-count 1 + forwards），actionTimer 回 idle ── */
  [data-action="stretch"] .pet-body { animation: pet-stretch 1.6s ease-in-out 1 forwards; }
  @keyframes pet-stretch { 0%, 100% { transform: scaleY(1); } 30%, 70% { transform: scaleY(1.06) translateY(-2px); } }
  [data-action="yawn"] .pet-body { animation: pet-yawn-body 1.8s ease-in-out 1 forwards; }
  @keyframes pet-yawn-body { 0%, 100% { transform: rotate(0deg); } 20%, 75% { transform: rotate(-4deg); } }
  [data-action="yawn"] .pet-eyes { animation: pet-yawn-eyes 1.8s ease-in-out 1 forwards; }
  @keyframes pet-yawn-eyes { 0%, 15% { transform: scaleY(1); } 35%, 75% { transform: scaleY(0.12); } 100% { transform: scaleY(1); } }
  [data-action="yawn"] .pet-mouth { animation: pet-yawn-mouth 1.8s ease-in-out 1 forwards; }
  @keyframes pet-yawn-mouth { 0%, 20% { transform: scaleY(1); } 45%, 70% { transform: scaleY(1.6); } 100% { transform: scaleY(1); } }
  [data-action="scratch"] .pet-body { animation: pet-scratch 1.2s ease-in-out 1 forwards; }
  @keyframes pet-scratch { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(5deg); } }
  [data-action="look"] .pet-body { animation: pet-look 1.4s ease-in-out 1 forwards; }
  @keyframes pet-look { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(4deg); } 50% { transform: rotate(-4deg); } 80% { transform: rotate(0deg); } }

  /* ── 情绪切换眨眼过渡：闭眼 50ms 换脸（SvgAvatar 经 data-blink 触发） ── */
  [data-blink="1"] .pet-eyes { animation: pet-blink-now 50ms ease-in-out 1 forwards; }
  @keyframes pet-blink-now { 0% { transform: scaleY(1); } 50% { transform: scaleY(0.12); } 100% { transform: scaleY(1); } }
`
