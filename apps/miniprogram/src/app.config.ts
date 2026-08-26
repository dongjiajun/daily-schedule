export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/calendar/index',
    'pages/todo/index',
    'pages/pet/index',
    'pages/profile/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '日程',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#4f7cff',
    backgroundColor: '#ffffff',
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/calendar/index', text: '日历' },
      { pagePath: 'pages/todo/index', text: '任务' },
      { pagePath: 'pages/pet/index', text: '宠物' },
      { pagePath: 'pages/profile/index', text: '我的' },
    ],
  },
})
