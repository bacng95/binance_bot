const Signal = require('../Signal')

module.exports = class ma_rsi_short {

    constructor () {
        this.options = {
            ma_length_1: 10,
            ma_length_2: 20,
            rsi_length: 14,
            rsi_top: 48,
            rsi_bot: 80,
            open_difference: 1,
            close_difference: 1
        }
    }

    getName () {
        return 'ma_rsi_short';
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
            !this.options.ma_length_1 ||
            !this.options.ma_length_2 ||
            !this.options.rsi_length ||
            !this.options.rsi_top ||
            !this.options.rsi_bot ||
            !this.exchange ||
            !this.options.open_difference || 
            !this.options.close_difference
        ) {
            return ;
        }
        
        const candles = this.exchange.getCandleReverse();

        if (!candles) {
            return ;
        }

        const debug = {
            strategy_name: this.getName(),
            ma_length_1: this.options.ma_length_1,
            ma_length_2: this.options.ma_length_2,
            rsi_length: this.options.rsi_length,
            rsi_top: this.options.rsi_top,
            rsi_bot: this.options.rsi_bot,
            open_difference: this.options.open_difference,
            close_difference: this.options.close_difference
        }

        const MA1 = this.exchange.ma(this.options.ma_length_1);
        const MA2 = this.exchange.ma(this.options.ma_length_2);
        const RSI = this.exchange.rsi(this.options.rsi_length);
        
        debug.candle_1_direction = candles[1].direction();
        debug.candle_2_direction = candles[0].direction();
        debug.candle_2_open = candles[0].open;
        debug.ma_1_1 = MA1[0];
        debug.ma_1_2 = MA1[1];
        debug.ma_2_1 = MA2[0];
        debug.ma_2_2 = MA2[1];
        debug.rsi_1 = RSI[0];
        debug.rsi_2 = RSI[1];
        debug.difference = this.exchange.candleRatio(candles[1], candles[0])


        // console.log(debug)

        ////// Short Signal

        if (
            candles[0].direction() == 1 &&                                      // N???n hi???n t???i l?? n???n xanh
            candles[1].direction() == 1 &&                                      // N???n tr?????c ???? l?? n???n xanh
            candles[1].open < MA1[1] &&                                         // N???n tr?????c ???? n???m d?????i MA1
            MA1[1] > MA2[0] &&                                                  // MA1 d?????i ???????ng MA2
            RSI[0] < this.options.rsi_top && RSI[0] > this.options.rsi_bot &&   // RSI n???n hi???n t???i trong kho???ng
            RSI[1] < this.options.rsi_top && RSI[1] > this.options.rsi_bot &&   // RSI n???n tr?????c ???? trong kho???ng
            this.exchange.candleRatio(candles[1], candles[0]) > this.options.open_difference && // t??? l??? c???a th??n n???n hi???n t???i l???n h??n open_difference so v???i n???n tr?????c
            (RSI[0] < RSI[1] && RSI[1] < RSI[2])                                // RSI 3 n???n li??n ti???p ??i xu???ng
        ) {
            return Signal.createSignal('short', this.exchange.getSymbol(), this.getName(), candles[1].close, debug)
        }


        ////// Close Signal

        if (
            candles[0].direction() == 0 &&      // N???n hi???n t???i l?? n???n xanh
            candles[1].direction() == 0 &&      // N???n tr?????c ???? l?? n???n xanh
            this.exchange.candleRatio(candles[1], candles[0]) > this.options.close_difference // t??? l??? c???a th??n n???n hi???n t???i l???n h??n open_difference so v???i n???n tr?????c
        ) {

            debug.candle_1_direction = candles[1].direction();
            debug.candle_2_direction = candles[0].direction();
            debug.difference = this.exchange.candleRatio(candles[1], candles[0])

            return Signal.createSignal('close', this.exchange.getSymbol(), this.getName(), candles[1].close, debug)
        }
    }


}