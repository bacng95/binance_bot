const Binance = require('node-binance-api');
const binance = new Binance().options();
const CandleStick = require('./CandleStick')
const Indicators = require('technicalindicators')
const logger = require('./logger')

module.exports = class Exchange {

    constructor (exchange, symbol, period, candles, event) {

        if (!['m', 'h', 'd', 'y'].includes(period.slice(-1))) {
            throw `Invalid candlestick period: ${period} - ${JSON.stringify(Object.values(arguments))}`;
        }

        this.exchange = exchange
        this.period = period
        this.candles = candles
        this.symbol = symbol
        this.event = event

        this.order = [];
    }

    getSymbol (symbol_name) {
        if (symbol_name) {
            return this.symbol[symbol_name]
        }
        return this.symbol
    }

    getFirstCandle () {
        return this.candles[this.candles.length - 1] || {}
    }

    getCandles () {
        return this.candles;
    }

    getCandleReverse() {
        let candle = Object.create(this.candles)
        return candle.reverse()
    }

    getCandleWithTime(time) {
        time = parseInt(time);
        return this.symbol.find(el => el.time === time)
    }

    liveUpdate() {
        if (this.exchange == 'FUTURE') {
            this.futureSubscribe(this.symbol, this.period, this.newCandleHandle.bind(this))
        }
        if (this.exchange == 'SPOT') {
            this.spotSubscribe(this.symbol, this.period, this.newCandleHandle.bind(this))
        }
    }

    newCandleHandle(event) {
        const self = this;
        this.updateNewCandle(event, self)
        this.event.emit('ticks', event)
    }

    updateNewCandle (event, self) {
        const { t: time, o: open, c: close, h: high, l: low, v: volume } = event.k;
        const candleIndex = self.candles.findIndex(el => el.time === time)
        if (candleIndex !== -1) {
            self.candles[candleIndex].set(
                time,
                open,
                high,
                low,
                close,
                volume
            )
        } else {
            const candle = CandleStick.createFromKlineStream(event.k)
            self.candles.push(candle)
        }
        // console.log('close: ', this.candles[this.candles.length - 1].close, ' - SMA: ', this.ma(10), ' - rsi: ', this.rsi())
    }

    spotUnSubscribe (symbol, period = '1m') {
        if (!symbol) { return }
        logger.log(`SPOT_UNSUB_${symbol}_${period}`)
        binance.websockets.terminate(`${symbol.toLowerCase()}@kline_${period}`);
    }

    spotSubscribe (symbol, period = '1m', callback) {
        if (!symbol) { return }
        logger.log(`SPOT_SUB_${symbol}_${period}`)
        binance.websockets.candlesticks(symbol, period, callback);
    }

    futureUnSubscribe (symbol, period = '1m') {
        if (!symbol) { return }
        logger.log(`FUTURE_UNSUB_${symbol}_${period}`)
        binance.futuresTerminate(`${symbol.toLowerCase()}@kline_${period}`);
    }

    futureSubscribe (symbol, period = '1m', callback) {
        if (!symbol) { return }
        logger.log(`FUTURE_SUB_${symbol}_${period}`)
        binance.futuresSubscribe(`${symbol.toLowerCase()}@kline_${period}`, callback);
    }


    /**
     * 
     * @param {CandleStick} candle1
     * @param {CandleStick} candle2 
     * @returns tỉ lệ tăng thân nến 2 so với thân nến 1
     */
    candleRatio (candle1, candle2) {
        if ( !candle1 || !candle2 || !(candle1 instanceof CandleStick) || !candle2 instanceof CandleStick) {
            return 0;
        }

        const candle1_high = Math.max(candle1.open, candle1.close);
        const candle1_low = Math.min(candle1.open, candle1.close);

        const candle2_high = Math.max(candle2.open, candle2.close);
        const candle2_low = Math.min(candle2.open, candle2.close);

        const onePercent = (candle1_high - candle1_low) / 100

        return (candle2_high - candle2_low) / onePercent;
    }

    /**
     * 
     * @param {*} length chieu dai
     * @param {*} source nguon
     * 
     * Chỉ báo
     * Đường trung bình động Moving Average
     */

    ma(length, source = 'close') {
        if (this.candles.length < length) {
            return 0
        }

        if ( !['high', 'low', 'open', 'close'].includes(source)) {
            return 0
        }
        let candles = Object.create(this.candles)
        candles = candles.splice(this.candles.length - length - 50)
        const prices = candles.map(candle => candle[source])
        
        return Indicators.sma({period: length, values: prices}).reverse();
    }


    rsi (length = 14) {
        let candles = Object.create(this.candles)
        candles = candles.splice(this.candles.length - length - 50)
        const prices = candles.map(candle => candle.close)

        return Indicators.rsi({period: length, values: prices}).reverse();
    }
}