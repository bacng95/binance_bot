module.exports = class CandleStick {
    constructor (time, open, high, low, close, volume) {
        time = parseInt(time);
        if (time <= 631148400) {
            throw `Invalid candlestick time given: ${time} - ${JSON.stringify(Object.values(arguments))}`;
        }

        this.time = time;
        this.open = parseFloat(open);
        this.high = parseFloat(high);
        this.low = parseFloat(low);
        this.close = parseFloat(close);
        this.volume = parseFloat(volume);
    }


    /**
     * 
     * @returns direction 1|0|2 2: up, 1: down, 0: not change
     */
    direction () {
        if (this.open > this.close) {
            return 1
        }

        if (this.open < this.close) {
            return 2
        }

        return 0
    }

    set (time, open, high, low, close, volume) {
        time = parseInt(time);
        if (time <= 631148400) {
            throw `Invalid candlestick time given: ${time} - ${JSON.stringify(Object.values(arguments))}`;
        }

        this.time = time;
        this.open = parseFloat(open);
        this.high = parseFloat(high);
        this.low = parseFloat(low);
        this.close = parseFloat(close);
        this.volume = parseFloat(volume);
    }

    static createFromCandle(candle) {
        return new CandleStick(
            candle.time,
            candle.open,
            candle.high,
            candle.low,
            candle.close,
            candle.volume
        );
    }

    static createFromKlineStream(kline) {
        const { t: time, o: open, c: close, h: high, l: low, v: volume } = kline
    
        return new CandleStick(
            time,
            open,
            close,
            high,
            low,
            volume
        );
    }

    static createFromKline(candle) {
        return new CandleStick(
            candle[0],
            candle[1],
            candle[2],
            candle[3],
            candle[4],
            candle[5]
        );
    }
}