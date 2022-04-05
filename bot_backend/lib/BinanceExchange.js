const Binance = require('node-binance-api');
const binance = new Binance().options();
const Database = require('./database');
const CandleStick = require('./CandleStick')
const Exchange = require('./Exchange')

const logger = require('./logger');

const period = '5m';

class BinanceExchange {

    constructor (cache, event) {
        this.symbol = {};
        this.cache = cache
        this.event = event

    }

    async init() {
        // await this.getExchangeSpot();
        await this.getExchangeFuture();

        // Nap nen lan dau
        await this.backfillAll();
        this.exchangeLive()

        this.eventListening()
    }

    
    async eventListening () {
        this.event.on('enableExchange', (data) => {
            console.log(data)
        })

        this.event.on('disableExchange', (data) => {
            console.log(data)
        })
    }


    async getSymbolEnable () {
        try {
            return await Database.table('exchange')
            .where('enable', 1)
        } catch (error) {
            logger.error(error.message, 'BinanceExchange.getSymbolEnable');
        }
    }

    async exchangeLive() {
        Object.keys(this.symbol).forEach(key => {
            this.symbol[key].liveUpdate()
        })
        
        // const self = this
        // setInterval(() => {
        //     // console.log(self.symbol)
        //     // console.log(self.symbol.FUTURE_BNBUSDT.getFirstCandle().close)
        // }, 5000)
    }

    async backfillAll () {
        const exchangeEnable = await this.getSymbolEnable()
        for (const exchange of exchangeEnable) {
            await this.backfill(exchange)
        }
        logger.log('BACKFILL DONE')
    }

    // Nap nến gần nhất
    async backfill (exchange) {

        if (typeof exchange !== 'object') {
            throw Error(`Invalid exchange: ${exchange}`)
        }
        
        logger.log(`BACKFILL_${exchange.type}_${exchange.symbol}`)
        try {
            let candles;
            if (exchange.type == 'FUTURE') {
                candles = await binance.futuresCandles(exchange.symbol, period )
            }

            if (exchange.type == 'SPOT') {
                candles = await binance.candlesticks(exchange.symbol, period)
            }

            if (candles) {
                const INDEX = `${exchange.type}_${exchange.symbol}`;
                this.symbol[INDEX] = new Exchange(
                    exchange.type,
                    exchange.symbol,
                    period,
                    candles.map(candle => {
                        return CandleStick.createFromKline(candle)
                    }),
                    this.event
                )
            }
        } catch (error) {
            logger.error(error.message, 'BinanceExchange.backfill')
        }
    }

    async getExchangeFuture () {
        try {
            const exchange = await binance.futuresExchangeInfo();
            let minimums = {};
            for (let obj of exchange.symbols) {
                let filters = {status: obj.status};

                if (obj.quoteAsset === 'USDT') {

                    for ( let filter of obj.filters ) {
                        if ( filter.filterType == "MIN_NOTIONAL" ) {
                            filters.minNotional = filter.minNotional;
                        } else if ( filter.filterType == "PRICE_FILTER" ) {
                            filters.minPrice = filter.minPrice;
                            filters.maxPrice = filter.maxPrice;
                            filters.tickSize = filter.tickSize;
                        } else if ( filter.filterType == "LOT_SIZE" ) {
                            filters.stepSize = filter.stepSize;
                            filters.minQty = filter.minQty;
                            filters.maxQty = filter.maxQty;
                        }
                    }
                    filters.quoteAsset = obj.quoteAsset;
                    filters.baseAssetPrecision = obj.baseAssetPrecision;
                    filters.quoteAssetPrecision = obj.quoteAssetPrecision;
                    filters.orderTypes = obj.orderTypes;
                    filters.icebergAllowed = obj.icebergAllowed;
                    filters.quantityPrecision = obj.quantityPrecision;


                    const checkExchange = await Database.table('exchange')
                    .where('symbol', obj.symbol)
                    .where('type', 'FUTURE')
                    .first();

                    const data = {
                        type: "FUTURE",
                        symbol: obj.symbol,
                        minPrice: filters.minPrice,
                        maxPrice: filters.maxPrice,
                        tickSize: filters.tickSize,
                        stepSize: filters.stepSize,
                        minQty: filters.minQty,
                        maxQty: filters.maxQty,
                        minNotional: filters.minNotional,
                        icebergAllowed: filters.icebergAllowed,
                        baseAssetPrecision: filters.baseAssetPrecision,
                        status: obj.status,
                        quantityPrecision: filters.quantityPrecision
                    }

                    this.cache.set(`EXCHANGE_${data.type}_${data.symbol}`, data)

                    if (checkExchange) {
                        await Database.table('exchange')
                        .where('id', checkExchange.id)
                        .update(data)
                    } else {
                        await Database.table('exchange')
                        .insert(data)
                    }
                };
            }
            logger.log('GET_EXCHANGE_FUTURE: DONE');
        } catch (error) {
            logger.log(error.message, 'BinanceExchange.getExchangeFuture')
        }
    }

    async getExchangeSpot () {
        try {
            const exchangeInfo = await binance.exchangeInfo()
            if (exchangeInfo) {
                let minimums = {};
                for ( let obj of exchangeInfo.symbols ) {
                    let filters = {status: obj.status};

                    if (obj.quoteAsset === 'USDT') {

                        for ( let filter of obj.filters ) {
                            if ( filter.filterType == "MIN_NOTIONAL" ) {
                                filters.minNotional = filter.minNotional;
                            } else if ( filter.filterType == "PRICE_FILTER" ) {
                                filters.minPrice = filter.minPrice;
                                filters.maxPrice = filter.maxPrice;
                                filters.tickSize = filter.tickSize;
                            } else if ( filter.filterType == "LOT_SIZE" ) {
                                filters.stepSize = filter.stepSize;
                                filters.minQty = filter.minQty;
                                filters.maxQty = filter.maxQty;
                            }
                        }
                        filters.quoteAsset = obj.quoteAsset;
                        filters.baseAssetPrecision = obj.baseAssetPrecision;
                        filters.quoteAssetPrecision = obj.quoteAssetPrecision;
                        filters.orderTypes = obj.orderTypes;
                        filters.icebergAllowed = obj.icebergAllowed;
                        filters.quantityPrecision = obj.quantityPrecision


                        for (let per of obj.permissions ) {
                            if (['SPOT'].includes(per)) {

                                const checkExchange = await Database.table('exchange')
                                .where('symbol', obj.symbol)
                                .where('type', 'SPOT')
                                .first();

                                const data = {
                                    type: 'SPOT',
                                    symbol: obj.symbol,
                                    minPrice: filters.minPrice,
                                    maxPrice: filters.maxPrice,
                                    tickSize: filters.tickSize,
                                    stepSize: filters.stepSize,
                                    minQty: filters.minQty,
                                    maxQty: filters.maxQty,
                                    minNotional: filters.minNotional,
                                    icebergAllowed: filters.icebergAllowed,
                                    baseAssetPrecision: filters.baseAssetPrecision,
                                    status: obj.status,
                                    quantityPrecision: filters.quantityPrecision
                                }
                                if (checkExchange) {
                                    await Database.table('exchange')
                                    .where('id', checkExchange.id)
                                    .update(data)
                                } else {
                                    await Database.table('exchange')
                                    .insert(data)
                                }
                            }
                        }
                        minimums[obj.symbol] = filters;
                    };
                }

                logger.log('GET_EXCHANGE_SPOT: DONE !');
            }
        } catch (error) {
            logger.error(error.message, 'BinanceExchange.getExchangeSpot')
        }
    }
}

module.exports = BinanceExchange;