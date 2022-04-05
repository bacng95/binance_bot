const Signal = require('../Signal')

module.exports = class ma_rsi_long {

    constructor () {
        this.options = {
            rsi_length: 14,
            rsi_top: 48,
            rsi_bot: 80,
        }
    }

    getName () {
        return 'rsi_long';
    }
    
    setOptions (options) {
        if (typeof options !== 'object') { return; }

        this.options = Object.assign(this.options, options)
    }
    
    setCandle (exchange) {
        this.exchange = exchange
    }

    period () {

        if (
            !this.options.rsi_length ||
            !this.options.rsi_top ||
            !this.options.rsi_bot ||
            !this.exchange
        ) {
            return ;
        }
        
        const candles = this.exchange.getCandleReverse();

        if (!candles) {
            return ;
        }

        const debug = {
            strategy_name: this.getName(),
            rsi_length: this.options.rsi_length,
            rsi_top: this.options.rsi_top,
            rsi_bot: this.options.rsi_bot,
        }

        const RSI = this.exchange.rsi(this.options.rsi_length);
        
        debug.rsi_1 = RSI[0];
        debug.rsi_2 = RSI[1];

        debug.dcaWith = 'RSI';

        ////// Buy Signal

        if (
            RSI[0] <= this.options.rsi_bot &&        // RSI nến hiện tại nằm dưới RSI thấp
            RSI[0] > RSI[1]   // RSI nến trước(1) thấp hơn nến hiện tại (0)
        ) {
            return Signal.createSignal('long', this.exchange.getSymbol(), this.getName(), candles[1].close, debug)
        }


        ////// Close Signal

        if (
            RSI[0] >= this.options.rsi_top &&      // RSI nến hiện tại nằm trên RSI cao
            RSI[0] < RSI[1]     // RSI nến hiện tại(0) nhỏ hơn RSI nến trước (1)
        ) {
            return Signal.createSignal('close', this.exchange.getSymbol(), this.getName(), candles[1].close, debug)
        }
    }


}