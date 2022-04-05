const fs = require('fs');
const path = require('path');
const Signal = require('./Signal');

module.exports = class StrategyManager {

	constructor() {
		this.strategies = undefined;
	}

	getStrategies() {
		if (typeof this.strategies !== 'undefined') {
			return this.strategies;
		}

		const strategies = [];

		const dirs = [`${__dirname}/strategies`];

		const recursiveReadDirSyncWithDirectoryOnly = (p, a = []) => {
			if (fs.statSync(p).isDirectory()) {
				fs.readdirSync(p)
					.filter(f => !f.startsWith('.') && fs.statSync(path.join(p, f)).isDirectory())
					.map(f => recursiveReadDirSyncWithDirectoryOnly(a[a.push(path.join(p, f)) - 1], a));
			}

			return a;
		};


		dirs.forEach(dir => {
			if (!fs.existsSync(dir)) {
				return;
			}

			fs.readdirSync(dir).forEach(file => {
				if (file.endsWith('.js')) {
					strategies.push(new (require(`${dir}/${file.substr(0, file.length - 3)}`))());
				}
			});

			// Allow strategies to be wrapped by any folder depth:
			// "foo/bar" => "foo/bar/bar.js"
			recursiveReadDirSyncWithDirectoryOnly(dir).forEach(folder => {
				const filename = `${folder}/${path.basename(folder)}.js`;

				if (fs.existsSync(filename)) {
					strategies.push(new (require(filename))());
				}
			});
		});

		return (this.strategies = strategies);
	}

	findStrategy(strategyName) {
		return this.getStrategies().find(strategy => strategy.getName() === strategyName);
	}

	getStrategyNames() {
		return this.getStrategies().map(strategy => strategy.getName());
	}

	async executeStrategy(strategyName, exchange, options) {

		const strategy = this.findStrategy(strategyName);

		if (strategy) {
			strategy.setOptions(options)
			strategy.setCandle(exchange)
			const strategyResult = await strategy.period();

			if (strategyResult) {
				if (typeof strategyResult !== 'undefined' && !(strategyResult instanceof Signal)) {
					throw new Error(`Invalid strategy return:${strategyName}`);
				}
				return strategyResult;
			}
		}
		return false
	}
}