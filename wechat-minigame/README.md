# 接星星 — 微信小游戏起步项目

基于 **Canvas 2D** 的竖屏小游戏：手指拖动底部托盘接住星星得分，躲开炸弹。适合作为微信小游戏的原型或学习模板。

## 玩法

- 拖动托盘接住黄色星星：+10 分
- 接到灰色炸弹：扣 1 条生命（共 3 条）
- 分数越高，下落速度越快
- 生命耗尽后点击「再来一局」重开

## 本地运行

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（选「小游戏」）
2. 注册小游戏账号，或使用工具内的 **测试号**
3. 打开开发者工具 → **小游戏** → **导入**
4. 目录选择本仓库下的 `wechat-minigame/`
5. 将 `project.config.json` 里的 `appid` 改成你的 AppID（测试号可保持 `touristappid`）
6. 点击「编译」即可在模拟器里试玩

## 项目结构

```text
wechat-minigame/
├── game.js                 # 入口
├── game.json               # 运行时配置（竖屏等）
├── project.config.json     # 开发者工具项目配置
├── js/
│   ├── main.js             # 主循环、生成物、碰撞
│   ├── render.js           # Canvas 与屏幕尺寸
│   ├── databus.js          # 分数、生命、状态
│   ├── player.js           # 托盘与触摸
│   ├── falling-item.js     # 星星 / 炸弹
│   └── hud.js              # 分数与结算 UI
└── README.md
```

## 下一步可以做什么

| 方向 | 说明 |
|------|------|
| **换题材** | 改 `falling-item.js` 的绘制与 `main.js` 的得分规则 |
| **接微信能力** | 排行榜（开放数据域）、分享卡片、激励视频等 |
| **用游戏引擎** | 体量变大时可用 [Cocos Creator](https://www.cocos.com/)、Laya、Unity 导出小游戏包 |
| **独立仓库** | 若与日程系统无关，可将 `wechat-minigame/` 单独建仓发布 |

## 参考文档

- [学习新手教程](https://developers.weixin.qq.com/minigame/dev/guide/develop/start.html)
- [小游戏配置 game.json](https://developers.weixin.qq.com/minigame/dev/reference/configuration/app.html)
