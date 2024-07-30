module.exports = {
  lintOnSave: false,
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production'
    ? '/rl_ladder/'
    : '/'
}
