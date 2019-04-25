const HOST = 'https://mbox.fontend.com'
module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
  },
  weapp: {},
  h5: {
    devServer: { 
      proxy: {
        '/': {
          target: HOST,
          changeOrigin: true
        }
      }
    }
  }
}
