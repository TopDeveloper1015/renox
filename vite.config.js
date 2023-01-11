
const { defineConfig } = require('vite');
const fs = require('fs');
const compression = require('compression');

/**
 * 
 * @returns {import('vite').PluginOption}
 */
const uniPlugin = () => ({
  name: 'uni-js-framework-server',
  configureServer(server) {
    const app = server.middlewares;
    // add gzip
    app.use(compression());
    // serve js framework assets
    app.use((req, res, next) => {
      if (!req.url.startsWith('/uni-js-framework')) return next();
      const file = 'node_modules/' + req.url;
      if (!fs.lstatSync(file).isFile()) return res.end('404');
      res.end(fs.readFileSync(file));
    });
    // app.use(async (req, res, next) => {
    //   const url = req.url.endsWith('/') ? req.url + 'index.html' : req.url;
    //   if (!url.endsWith('.html')) return next();
    //   console.log('url', url);
    //   const file = 'src/' + url;
    //   if (!fs.lstatSync(file).isFile()) return res.end('404');
    //   const content = fs.readFileSync(file, 'utf-8');
    //   let i = 0;
    //   /*
    //
    //   */
    //   for (const match of content.matchAll(/<script run-in-server>(?<code>[\s\S]*?)<\/script>/g)) {
    //     const result = await new Function(match.groups.code)();
    //     const chunk = content.slice(i, i = match.index);
    //     i += match[0].length;
    //     res.write(chunk);
    //     res.write(result);
    //   }
    //   res.end(content.slice(i));
    // });
  }
});

// https://vitejs.dev/config/
exports.default = defineConfig({
  root: './src',
  plugins: [
    uniPlugin(),
  ],
  server: {
    // auto open this page
    open: '/index.html',
  }
});