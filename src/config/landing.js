/**
 * 封面页文案配置
 *
 * 修改此文件即可更新封面页的所有展示内容。
 * 支持 HTML 标签（如 <b>、<br>、<a>）。
 */

export default {
  // 主标题
  title: 'Deco My Tree',

  // 副标题
  subtitle: '一棵属于冬日的「时间胶囊」圣诞树',

  // 简介段落（支持 HTML）
  description: `
    在这棵树上挂下你的祝福、心愿或照片，
    它们会被 <b>封印</b> 起来——直到圣诞节当天，
    所有礼物自动解封，我们一起回看这棵承载记忆的树。
  `,

  // 功能亮点（图标 + 标题 + 描述）
  features: [
    {
      icon: '🎁',
      title: '挂上你的礼物',
      desc: '点击树上的空白处，写下祝福、上传照片（最多 3 张）',
    },
    {
      icon: '🔒',
      title: '时间胶囊',
      desc: '留言在圣诞节前加密封存，12 月 25 日统一解锁',
    },
    {
      icon: '🌲',
      title: '创建你的树',
      desc: '登录后种下一棵属于自己的圣诞树，分享给朋友',
    },
    {
      icon: '⭐',
      title: '关注与互动',
      desc: '关注朋友的树，在不同的树之间留下你的足迹',
    },
  ],

  // 行动按钮
  cta: {
    login: '登录 / 注册',
    explore: '先逛逛',
  },

  // 底部信息
  footer: {
    text: 'Build with ❤️',
    github: 'https://github.com/shmilyty/deco',
  },
};
