const events = require('events');

const BinanceExchange = require('../lib/BinanceExchange')
const redis = require('./cache');
const UserExchange = require('./user_exchange');
const Trade = require('./trade');
const StrategyManager = require('../lib/strategy/strategy_manager')

let eventEmitter;
let exchange;
let cache;
let userExchange;
let strategyManager;

module.exports = {

    getEventEmitter: function () {
		if (eventEmitter) {
			return eventEmitter;
		}

		return (eventEmitter = new events.EventEmitter());
	},
    getExchanges: function () {
        if (exchange) {
            return exchange
        }

        return (exchange = new BinanceExchange(this.getCache(), this.getEventEmitter()))
    },
    getCache: function () {
        if (cache) {
            return cache
        }
        return (cache = new redis())
    },
    getUserExchange: function () {
        if (userExchange) {
            return userExchange
        }
        
        return (userExchange = new UserExchange(this.getCache(), this.getEventEmitter()))
    },
    getStrategyManager: function () {
		if (strategyManager) {
			return strategyManager;
		}

		return (strategyManager = new StrategyManager());
	},

    createTradeInstance: function () {
        return new Trade(this.getUserExchange(), this.getExchanges(), this.getStrategyManager())
    }
}