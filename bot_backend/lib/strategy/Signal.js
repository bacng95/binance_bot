module.exports = class Signal {
    constructor () {
        this.debug = {};
        this.signal = undefined;
        this.placeOrder = 0;
        this.strategy = '';
        this.symbol = ''
    }

    getPlaceOrder () {
        return this.placeOrder
    }

    setPlaceOrder(placeOrder) {
        this.placeOrder = placeOrder
    }

    mergeDebug (debug) {
        this.debug = Object.assign(this.debug, debug);
    }

    getDebug () {
        return this.debug;
    }

    setSymbol (symbol) {
        this.symbol = symbol
    }

    getSymbol () {
        return this.symbol;
    }

    setStrategy (strategyName) {
        this.strategy = strategyName;
    }

    getStrategy () {
        return this.strategy
    }

    getSignal () {
        return this.signal;
    }

    setSignal (signal) {

        if (!['long', 'short', 'close'].includes(signal)) {
            throw `Invalid signal:${signal}`;
        }

        this.signal = signal
    }


    static createSignal(signal, symbol, strategy, placeOrder, debug = {}) {
        const result = new Signal();

        result.setPlaceOrder(placeOrder);
        result.setSignal(signal);
        result.setSymbol(symbol);
        result.setStrategy(strategy);
        result.mergeDebug(debug);

        return result;
    }


    static createEmptySignal (debug = {}) {
        const result = new Signal();

        result.mergeDebug(debug)

        return result;
    }

}