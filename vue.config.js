module.exports = {
  lintOnSave: false,
  transpileDependencies: [],  // 现在设置为一个空数组
  publicPath: process.env.NODE_ENV === 'production'
    ? '/rl_ladder/'
    : '/'
}
