all:
	NODE_ENV=production gulp
	NODE_ENV=production ./node_modules/webpack/bin/webpack.js --config webpack.config.js

dev:
	gulp
	./node_modules/webpack/bin/webpack.js --config webpack.config.js
