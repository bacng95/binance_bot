const Binance = require('node-binance-api');
const Database = require('../lib/database');
const Signal = require('../lib/strategy/Signal')

const test = true

module.exports = class User {
    constructor(user, cache, event, exchange) {
        this.user = user;
        this.cache = cache;
        this.event = event;
        this.exchange = exchange
        this.future = {
            assets: [],
            orders: [],
            positions: []
        };

        this.signal = {};

        this.binance = null;

        this.getSignalHistory();
        this.initBinance();
        this.getFutureOrders()
        this.getFutureAccount();
        this.subscribeFutureData();
        
        const self = this;
        setInterval(() => {
            this.dcaProcess()
            this.trailingStop()
        }, 5000)
    }

    async dcaProcess () {
        const positions = this.getOpenPosition()
        
        if (positions) {
            for (let index = 0; index < positions.length; index++) {
                const position = positions[index];
                let userSettings = await this.getUserSetting(position.symbol, 'FUTURE')
                userSettings.dca = JSON.parse(userSettings.dca)
                const positionSide = parseFloat(position.positionAmount) > 0 ? 'BUY' : 'SELL'

                const lastSignal = this.signal[position.symbol][this.signal[position.symbol].length - 1]

                if ((lastSignal.getSignal() === 'long' && userSettings.dca.buyState && parseFloat(position.positionAmount) > 0) || (lastSignal.getSignal() === 'short' && userSettings.dca.sellState && parseFloat(position.positionAmount) < 0)) {

                    if (
                        lastSignal && lastSignal.getSignal() !== 'close' && // Signal hiện tại không phải lệnh đóng
                        lastSignal.getDebug()?.dcaWith && // Chiến thuật có sử dụng DCA
                        (lastSignal.getDebug()?.dcaLength && lastSignal.getDebug()?.dcaLength < userSettings.dca.dcaLenght) // chưa DCA quá số lần đã cài trước
                    ) { // Neu chien thuat co su dung dca
    
                        if (lastSignal.getDebug()?.dcaWith == 'RSI' && lastSignal.getDebug()?.rsi_1) {  // DCA voi duong RSI

                            let last_dca_rsi = !lastSignal.getDebug()?.dcaRSI ? lastSignal.getDebug()?.rsi_1 : lastSignal.getDebug()?.dcaRSI
                            
                            const RSI = this.exchange.symbol[`FUTURE_${position.symbol}`]?.rsi(lastSignal.getDebug()?.rsi_length)
                            let rsiPercent = 0;
                            if (lastSignal.getSignal() === 'long') {
                                rsiPercent = (last_dca_rsi - RSI[0]) / RSI[0] * 100
                            } else {
                                rsiPercent = (RSI[0] - last_dca_rsi) / last_dca_rsi * 100
                            }

                            ///////// DCA ACTION
                            if (rsiPercent >= parseFloat(userSettings.dca.step)) {
                                console.log('------DCA-----');
                                const exchangeInfo = await this.cache.get(`EXCHANGE_FUTURE_${signal.symbol}`)
                                const orderQuantity = this.usdtToSymbolQuantity(position.symbol, userSettings.orderAmount, exchangeInfo.quantityPrecision)
                                this.Order(positionSide,  position.symbol, orderQuantity, false, {
                                    type: 'MARKET',
                                })

                                lastSignal.mergeDebug({
                                    dcaLength: lastSignal.getDebug()?.dcaLength ? 0 : lastSignal.getDebug()?.dcaLength,
                                    dcaRSI: RSI[0]
                                })
                            }
                        }
                    }
                }
            }
        }
    }

    async trailingStop () {
        const positions = this.getOpenPosition()

        if (positions) {
            for (let index = 0; index < positions.length; index++) {
                const position = positions[index];
                const orderOfPosition = this.getOpenOrder(position.symbol)
                const userSettings = await this.getUserSetting(position.symbol, 'FUTURE')
                const candleNow = this.exchange.symbol[`FUTURE_${position.symbol}`]?.getFirstCandle()
                // 
                if (position && userSettings.callbackRate && candleNow) { // chạy trailingStop

                    const orderStoploss = orderOfPosition.find(el => {
                        return el.orderType == 'STOP_MARKET'
                    })

                    if (orderStoploss) {  // Nếu đang có stoploss

                        const positionSide = parseFloat(position.positionAmount) > 0 ? 'BUY' : 'SELL'

                        if (positionSide == 'BUY') { // side BUY

                            if (parseFloat(orderStoploss.stopPrice) >= position.entryPrice) { // stoploss đã nằm trên entry

                                const pecent = this.profitPecentCalc(positionSide, parseFloat(orderStoploss.stopPrice), candleNow.close) // Tính % lợi nhuận theo stoploss
                                
                                if (Math.abs(pecent) > userSettings.callbackRate * 2) { // x2 callbackRate

                                    await this.cancelOrder(orderStoploss.symbol, orderStoploss.orderId)

                                    /// Check profit point
                                    // Nếu stoploss gần take_profit 1 khoảng callbackrate thì hủy luôn take_profit
                                    const orderTakeProfit = orderOfPosition.find(el => {
                                        return el.orderType == 'TAKE_PROFIT_MARKET'
                                    })
                                    if (orderTakeProfit) {
                                        const pecentTakeProfit = this.profitPecentCalc(positionSide, candleNow.close, orderTakeProfit.stopPrice)

                                        if (pecentTakeProfit < userSettings.callbackRate) {
                                            await this.cancelOrder(orderStoploss.symbol, orderTakeProfit.orderId)
                                        }
                                    }

                                    //////////////////////////////
                                    
                                    this.Order(positionSide === 'BUY' ? 'SELL' : 'BUY',  orderStoploss.symbol, Math.abs(parseFloat(position.positionAmount)), false, {
                                        type: 'STOP_MARKET',
                                        stopPrice: orderStoploss.stopPrice,
                                        priceProtect: true
                                    })
                                }

                            } else { // stoploss nằm dưới entry

                                const pecent = this.profitPecentCalc(positionSide, parseFloat(position.entryPrice), candleNow.close)  // Tính lợi nhuận theo entry

                                if (Math.abs(pecent) > userSettings.callbackRate) {

                                    // Đặt lại stoploss
                                    await this.cancelOrder(orderStoploss.symbol, orderStoploss.orderId)
                                    this.Order(positionSide === 'BUY' ? 'SELL' : 'BUY',  orderStoploss.symbol, Math.abs(parseFloat(position.positionAmount)), false, {
                                        type: 'STOP_MARKET',
                                        stopPrice: position.entryPrice,
                                        priceProtect: true
                                    })

                                }
                            }
                        } else {  // side SELL

                            if (parseFloat(orderStoploss.stopPrice) <= position.entryPrice) { // stoploss đã nằm trên entry

                                const pecent = this.profitPecentCalc(positionSide, parseFloat(orderStoploss.stopPrice), candleNow.close) // Tính % lợi nhuận theo stoploss
                                
                                if (Math.abs(pecent) > userSettings.callbackRate * 2) { // x2 callbackRate

                                    await this.cancelOrder(orderStoploss.symbol, orderStoploss.orderId)

                                    /// Check profit point
                                    // Nếu stoploss gần take_profit 1 khoảng callbackrate thì hủy luôn take_profit
                                    const orderTakeProfit = orderOfPosition.find(el => {
                                        return el.orderType == 'TAKE_PROFIT_MARKET'
                                    })
                                    if (orderTakeProfit) {
                                        const pecentTakeProfit = this.profitPecentCalc(positionSide, candleNow.close, orderTakeProfit.stopPrice)

                                        if (pecentTakeProfit < userSettings.callbackRate) {
                                            await this.cancelOrder(orderStoploss.symbol, orderTakeProfit.orderId)
                                        }
                                    }

                                    //////////////////////////////
                                    
                                    this.Order(positionSide === 'BUY' ? 'SELL' : 'BUY',  orderStoploss.symbol, Math.abs(parseFloat(position.positionAmount)), false, {
                                        type: 'STOP_MARKET',
                                        stopPrice: orderStoploss.stopPrice,
                                        priceProtect: true
                                    })
                                }

                            } else { // stoploss nằm dưới entry

                                const pecent = this.profitPecentCalc(positionSide, parseFloat(position.entryPrice), candleNow.close)  // Tính lợi nhuận theo entry

                                if (Math.abs(pecent) > userSettings.callbackRate) {

                                    // Đặt lại stoploss
                                    await this.cancelOrder(orderStoploss.symbol, orderStoploss.orderId)
                                    this.Order(positionSide === 'BUY' ? 'SELL' : 'BUY',  orderStoploss.symbol, Math.abs(parseFloat(position.positionAmount)), false, {
                                        type: 'STOP_MARKET',
                                        stopPrice: position.entryPrice,
                                        priceProtect: true
                                    })

                                }
                            }
                        }
                    }
                }
            }
        }
    }

    usdtToSymbolQuantity (symbol, usdtQuantity, fixed = 2) {
        const priceNow = this.exchange.symbol[`FUTURE_${symbol}`].getFirstCandle().close
        return (usdtQuantity / priceNow).toFixed(fixed)
    }

    async cancelOrder (symbol, orderId) {
        await this.binance.futuresCancel(symbol, {
            orderId
        })
    }

    profitPecentCalc(side, entry, priceNow) {
        let _price = entry - priceNow;
        if (side == "BUY") {
            _price = priceNow - entry
        }
        
        return _price / priceNow * 100
    }

    getOpenOrder (symbol) {
        return this.future.orders.filter(el => {
            return el.order.orderStatus == 'NEW' && el.order.symbol === symbol
        })
    }

    getOpenPosition () {
        const position = this.future.positions.filter(el => {
            return parseFloat(el.entryPrice) > 0
        })
    }

    percentTakeProfitCalculator (side, entry, ratio) {
        let result
        if (side.toUpperCase() == 'BUY')
            result = entry + entry / 100 * ratio
        else
            result = entry - entry / 100 * ratio

        return result.toFixed(1)
    }

    percentStoplossCalculator (side, entry, ratio) {
        let result
        if (side.toUpperCase() == 'SELL')
            result = entry + entry / 100 * ratio
        else
            result = entry - entry / 100 * ratio

        return result.toFixed(1)
    }

    async cancelAllOrderOfSymbol (symbol) {
        await this.binance.futuresCancelAll(symbol)
    }

    async openOrderWithTPSL(side, symbol, entry) {

        const position = this.future.positions.find(el => {
            return el.symbol == symbol
        })
        
        const userSettings = await this.getUserSetting(symbol, 'FUTURE')

        if (position && userSettings) {
            // Trước khi mở order mới
            // Hủy toàn bộ order của position này
            await this.cancelAllOrderOfSymbol(symbol)

            // Mở order take profit
            if (userSettings.takeprofit) {
                this.openOrderTakeProfit(side, symbol, Math.abs(parseFloat(position.positionAmount)), parseFloat(entry), userSettings.takeprofit)
            }
            // Mở order stoploss
            if (userSettings.stoploss) {
                this.openOrderStoploss(side, symbol, Math.abs(parseFloat(position.positionAmount)), parseFloat(entry), userSettings.stoploss)
            }
        }
    }

    async openOrderTakeProfit (side, symbol, size, entry, percentTakeProfit) {
        const stopPrice = this.percentTakeProfitCalculator(side, entry, percentTakeProfit)
        side = side == 'SELL' ? 'BUY' : 'SELL'
        this.Order(side, symbol, size, false, {
            type: 'TAKE_PROFIT_MARKET',
            stopPrice,
            priceProtect: true
        })
    }

    async openOrderStoploss (side, symbol, size, entry, percentStoploss) {
        // if (this.setLeverage(symbol, leverage)) {
            const stopPrice = this.percentStoplossCalculator(side, entry, percentStoploss)
            side = side == 'SELL' ? 'BUY' : 'SELL'
            this.Order(side, symbol, size, false, {
                type: 'STOP_MARKET',
                stopPrice,
                priceProtect: true
            })
        // }
    }

    async openOrderEntry (side, symbol, type, size, leverage, price = false) {
        if (this.validOrderSize(symbol, type, size)) {
            if (this.setLeverage(symbol, leverage)) {
                this.Order(side, symbol, size, price, {
                    type: 'MARKET'
                })
            }
        }
    }

    async setLeverage(symbol, leverage) {
        const futuresLeverage = await this.binance.futuresLeverage(symbol.toUpperCase(), leverage);
        if (futuresLeverage.code) {
            console.log(futuresLeverage.msg)
            return false
        }
        return true;
    }



    async getUserSetting (symbol, type) {
        // get on cache
        const userSettingOnCache = await this.cache?.get(`EXCHANGE_SETTING_${this.user.id}_${symbol}_${type}`)
        if (userSettingOnCache) {
            return userSettingOnCache
        } else {
            // get on database
            const userSettings = await Database.table('exchange_settings as exs')
            .join('users as u', 'u.id', 'exs.user_id')
            .join('exchange as ex', 'ex.id', 'exs.exchange_id')
            .where('exs.status', 1)
            .where('ex.enable', 1)
            .where('exs.user_id', this.user.id)
            .where('ex.type', type)
            .where('ex.symbol', symbol)
            .select('exs.*', 'exs.id as setting_id', 'u.id as user_id', 'u.email as user_email', 'ex.symbol', 'ex.type')
            .first()

            if (userSettings) {
                this.cache?.set(`EXCHANGE_SETTING_${this.user.id}_${symbol}_${type}`, userSettings)

                return userSettings;
            }
        }
        return false
    }

    async validOrderSize (symbol, type, order_size) {
        if (order_size < 0) { return false; }

        const infoExchange = await this.getInfoExchange(symbol, type)
        if ((order_size - infoExchange.minQty) % infoExchange.stepSize == 0) {
            return true
        }

        return false
    }

    async getInfoExchange(symbol, type) {
        let exchangeInfo = await this.cache?.get(`EXCHANGE_${type}_${symbol}`)
        return exchangeInfo
    }

    async Order (side, symbol, size, price = false , params) {
        try {
            if (!['BUY', 'SELL'].includes(side.toUpperCase())) {
                throw Error(`invalid order side`)
            }
    
            if (size < 0) {
                throw Error(`invalid order size`)
            }
            
            const futuresOrder = await this.binance.futuresOrder(side.toUpperCase(), symbol.toUpperCase(), size, price, params);

            console.log('futuresOrder: ', futuresOrder)

            if (futuresOrder.orderId) {
                return true
            } else {
                console.log(futuresOrder.msg)
                return false
            }

        } catch (error) {
            throw Error(error.message)
        }
    }

    async getSignalHistory () {
        const exchangeEnable = await this.getExchangeEnable()
        const exchangeEnableIds = exchangeEnable ? exchangeEnable.map(el => { return [el.id] }) : []
        const signalHistory = await Database.table('exchange_signal')
        .where('user_id', this.user.id)
        .whereIn('exchange_id', exchangeEnableIds)
        
        for (let index = 0; index < signalHistory.length; index++) {
            const signal = signalHistory[index];
            if (!this.signal[signal.symbol]) {
                this.signal[signal.symbol] = []
            }
            this.signal[signal.symbol].push(Signal.createSignal(signal.trade_signal, signal.symbol, signal.strategy, JSON.parse(signal.data)))
        }
    }

    async getExchangeEnable () {
        return await Database.table('exchange_settings')
        .where('user_id', this.user.id)
    }

    async addSignalDatabase (signal, exchange_settings_id, type) {
        await Database.table('exchange_signal')
        .insert({
            user_id: this.user.id,
            exchange_id: exchange_settings_id,
            symbol: signal.getSymbol(),
            type,
            trade_signal: signal.getSignal(),
            strategy: signal.getStrategy(),
            data: JSON.stringify(signal.getDebug())
        })
    }

    async pushSignal (exchange_settings_id, type, signal) {

        if (!this.signal[signal.symbol]) {
            this.signal[signal.symbol] = []
        }

        const sinalLenght = this.signal[signal.symbol].length - 1;
        const lastSignal = this.signal[signal.symbol][sinalLenght];
        let userSettings = await this.getUserSetting(signal.symbol, type)

        if ((!lastSignal || lastSignal.getSignal() == 'close') && signal.signal != 'close') { // Tín hiệu mở lệnh
            const side = signal.signal == 'long' ? 'BUY' : 'SELL'

            // Mở lệnh

            const exchangeInfo = await this.cache.get(`EXCHANGE_FUTURE_${signal.symbol}`)
            if (parseFloat(this.usdtToSymbolQuantity(signal.symbol ,userSettings.orderAmount, exchangeInfo.quantityPrecision)) > exchangeInfo.stepSize) {
                this.openOrderEntry(side, signal.getSymbol(), 'MARKET', this.usdtToSymbolQuantity(signal.symbol ,userSettings.orderAmount, exchangeInfo.quantityPrecision), userSettings.orderLeverage)
            }

            this.signal[signal.symbol].push(signal)
            await this.addSignalDatabase(signal, exchange_settings_id, type)

        } else if ((!lastSignal || lastSignal.getSignal() != 'close') && signal.signal == 'close' && (!lastSignal || lastSignal.getStrategy() == signal.strategy)) { // Tín hiệu đóng lệnh

            // Đóng position

            const position = this.future.positions.find(el => {
                return el.symbol == signal.symbol
            })

            if (Math.abs(parseFloat(position.positionAmount)) > 0) {
                this.Order(position.side == 'SELL' ? 'BUY' : 'SELL', position.symbol, Math.abs(parseFloat(position.positionAmount)), false, { type: 'MARKET' })
            }

            this.signal[signal.symbol].push(signal)
            await this.addSignalDatabase(signal, exchange_settings_id, type)
        }
    }

    getUser () {
        return this.user;
    }

    getFutureOrder () {
        return this.future.orders;
    }

    async getFutureOrders () {

        const futuresAllOrders = await this.binance.futuresAllOrders()

        if (futuresAllOrders.code) {
            throw Error(`user.getFutureOrders: ${futuresAllOrders.msg}`)
        } else {
            this.future.orders = futuresAllOrders.map(el => {
                return {
                    order: {
                        symbol: el.symbol,
                        clientOrderId: el.clientOrderId,
                        side: el.side,
                        orderStatus: el.status,
                        orderType: el.type,
                        timeInForce: el.timeInForce,
                        originalQuantity: el.origQty,
                        originalPrice: el.origQty,
                        averagePrice: el.avgPrice,
                        stopPrice: el.stopPrice,
                        executionType: el.executionType,
                        orderStatus: el.orderStatus,
                        orderId: el.orderId,
                        orderLastFilledQuantity: el.orderLastFilledQuantity,
                        orderFilledAccumulatedQuantity: el.orderFilledAccumulatedQuantity,
                        lastFilledPrice: el.lastFilledPrice,
                        commissionAsset: el.commissionAsset,
                        commission: el.commission,
                        orderTradeTime: el.time,
                        tradeId: 0,
                        bidsNotional: '0',
                        stopPriceWorkingType: el.workingType,
                        originalOrderType: el.origType,
                        positionSide: el.positionSide,
                        closeAll: el.closeAll,
                        isReduceOnly: el.reduceOnly
                    }
                }
            });
        }
    }

    async getFutureAccount () {
        let futureAccount = await this.binance.futuresAccount()

        if (futureAccount.code) {
            throw Error(`user.getFutureAccount: ${futureAccount.msg}`)
        } else {

            for (let index = 0; index < futureAccount.positions.length; index++) {
                futureAccount.positions[index].positionAmount = parseFloat(futureAccount.positions[index].positionAmt)
                delete futureAccount.positions[index].positionAmt
            }
            
            this.future = Object.assign(this.future, futureAccount)

            // assets insert database
            for (let index = 0; index < futureAccount.assets.length; index++) {
                const asset = futureAccount.assets[index];
                this.insertDatabaseWallet(asset, 'FUTURE')
                this.cache?.set(`USER_WALLET_FUTURE_${this.user.id}_${asset.asset}`, asset.walletBalance)
            }
        }
    }

    async insertDatabaseWallet (wallet, type) {
        const checkWallet = await Database.table('wallet')
        .where('wallet_type', type)
        .where('symbol', wallet.asset)
        .where('user_id', this.user.id)
        .first()

        if (checkWallet) {
            await Database.table('wallet')
            .where('id', checkWallet.id)
            .update({
                amount: wallet.walletBalance
            })
        } else {
            await Database.table('wallet')
            .insert({
                wallet_type: type,
                user_id: this.user.id,
                symbol: wallet.asset,
                amount: wallet.walletBalance
            })
        }
    }

    initBinance () {
        if (this.user.api_key && this.user.api_secret) {
            this.binance = new Binance().options({
                APIKEY: this.user.api_key,
                APISECRET: this.user.api_secret,
                test
            })
        }
    }

    newMarginSignal (res) {
        console.log('newMarginSignal: ', res);
    };

    newSubscribedSignal (res) {
        // console.log('newSubscribedSignal: ', res);
    };

    newAccountSignal (res) {

        if (res.eventType == 'ACCOUNT_UPDATE') {

            // Update balances
            if (res?.updateData?.balances) {
                for (let index = 0; index < res.updateData.balances.length; index++) {
                    const element = res.updateData.balances[index];
                    const findAssetIndex = this.future.assets.findIndex( el => {
                        return el.asset === element.asset
                    })

                    if (findAssetIndex != -1) {
                        this.future.assets[findAssetIndex] = Object.assign(this.future.assets[findAssetIndex], element)
                    } else {
                        this.future.assets.push(element)
                    }
                }
            }

            // Update positions
            if (res?.updateData?.positions) {
                for (let index = 0; index < res.updateData.positions.length; index++) {
                    const element = res.updateData.positions[index];
                    const findAssetIndex = this.future.positions.findIndex( el => {
                        return el.symbol === element.symbol
                    })

                    if (findAssetIndex != -1) {
                        this.future.positions[findAssetIndex] = Object.assign(this.future.positions[findAssetIndex], element)
                    } else {
                        this.future.positions.push(element)
                    }
                }
            }
        }
    };

    async newOrderSignal (res) {
        const checkOrderHistory = this.future.orders.findIndex(el => {
            return el.order.orderId === res.order.orderId
        })
        if (checkOrderHistory != -1) {
            this.future.orders[checkOrderHistory] = Object.assign(this.future.orders[checkOrderHistory], res)
        } else {
            this.future.orders.push(res);
        }

        if (res.eventType == 'ORDER_TRADE_UPDATE') {
            if (res.order.orderStatus == 'FILLED') {

                if (res.order.executionType == 'TRADE' && res.order.orderType == "MARKET") { // Order market

                    // Check position
                    const position = this.future.positions.find(el => {
                        return el.symbol == res.order.symbol
                    })

                    if (position?.positionAmount && position?.positionAmount == 0) {
                        // Hủy toàn bộ order của position này
                        this.cancelAllOrderOfSymbol(res.order.symbol)
                    } else {
                        this.openOrderWithTPSL(res.order.side, res.order.symbol, res.order.lastFilledPrice)
                    }                    
                }
            }
        }

        console.log('newOrderSignal: ', res);
    };

    subscribeFutureData() {
        this.binance.websockets.userFutureData(
            this.newMarginSignal.bind(this),
            this.newAccountSignal.bind(this),
            this.newOrderSignal.bind(this),
            this.newSubscribedSignal.bind(this)
        );
    }

    static createUser (user, cache, event, exchange) {
        return new User(user, cache, event, exchange)
    }
}