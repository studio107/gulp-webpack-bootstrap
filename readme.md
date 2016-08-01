# Установка

```
npm i
bower install
```

# Сборка для DEV

```
gulp && gulp watch
npm run server
# или
make dev
# или
gulp
./node_modules/webpack/bin/webpack.js --config webpack.config.js
```

# Сборка для PRODUCTION

```
make
# или 
NODE_ENV=production gulp
NODE_ENV=production ./node_modules/webpack/bin/webpack.js --config webpack.config.js
```