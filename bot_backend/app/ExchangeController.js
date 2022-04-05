const Database = require("../lib/database")
const service = require('../modules/services')

module.exports = class ExchangeController {

    async exchangeEdit (request, response) {
        try {
            const {exchange} = request.body

            if (exchange.id) {
                const checkUserExchange = await Database.table('exchange')
                .where('id', exchange.id)
                .first()

                if (checkUserExchange) {
                    const exchangeSettings = JSON.parse(checkUserExchange.strategy) || {};
                    const newExchangeSettings = Object.assign(exchangeSettings, exchange.strategy)
                    await Database.table('exchange')
                    .where('id', checkUserExchange.id)
                    .update({
                        strategy: JSON.stringify(newExchangeSettings),
                        enable: exchange.enable
                    })
                }

                if (checkUserExchange.enable != exchange.enable) {

                    if (exchange.enable) {
                        service.getEventEmitter().emit('enableExchange', exchange)
                    } else {
                        service.getEventEmitter().emit('disableExchange', exchange)
                    }
                }
                // const cache = service.getCache().get(`EXCHANGE_SETTING_${request.user.id}_${exchange.symbol}_${exchange.type}`)
                // if (cache) {
                //     strategy
                // }

                return response.json({
                    code: 1,
                    msg: 'Thành công',
                })
            }

            return response.json({
                code: 0,
                msg: 'missing data !'
            })
        } catch (error) {
            return response.json({
                code: 0,
                msg: error.message
            })
        }
    }

    async exchangeSettingEdit (request, response) {
        try {
            const {exchange_id, strategy, orderAmount, orderLeverage, takeprofit, stoploss, callbackRate, dca } = request.body

            if (exchange_id && strategy) {
                const checkUserExchange = await Database.table('exchange_settings')
                .where('user_id', request.user.id)
                .where('id', exchange_id)
                .first()

                if (checkUserExchange) {
                    const exchangeSettings = JSON.parse(checkUserExchange.strategy) || {};
                    const newExchangeSettings = Object.assign(exchangeSettings, strategy)
                    await Database.table('exchange_settings')
                    .where('id', checkUserExchange.id)
                    .update({
                        strategy: JSON.stringify(newExchangeSettings),
                        orderAmount,
                        orderLeverage,
                        takeprofit,
                        stoploss,
                        callbackRate,
                        dca: JSON.stringify(dca)
                    })
                }

                return response.json({
                    code: 1,
                    msg: 'Thành công',
                })
            }

            return response.json({
                code: 0,
                msg: 'missing data !'
            })
        } catch (error) {
            return response.json({
                code: 0,
                msg: error.message
            })
        }
    }

    async exchangeSettingAdd (request, response) {
        try {
            const {exchange, strategy, orderAmount, orderLeverage, takeprofit, stoploss, callbackRate, dca } = request.body

            if (exchange && strategy) {
                const checkUserExchange = await Database.table('exchange_settings')
                .where('user_id', request.user.id)
                .where('exchange_id', exchange)
                .first()

                if (!checkUserExchange) {
                    await Database.table('exchange_settings')
                    .insert({
                        user_id: request.user.id,
                        exchange_id: exchange,
                        strategy: JSON.stringify(strategy),
                        orderAmount,
                        orderLeverage,
                        takeprofit,
                        stoploss,
                        callbackRate,
                        dca: JSON.stringify(dca),
                        status: 1
                    })
                }

                return response.json({
                    code: 1,
                    msg: 'Thành công',
                })
            }

            return response.json({
                code: 0,
                msg: 'missing data !'
            })
        } catch (error) {
            return response.json({
                code: 0,
                msg: error.message
            })
        }
    }

    async exchangeUserChangeStaus (request, response) {
        const { id, status } = request.body;

        if (id && status !== undefined) {
            await Database.table('exchange_settings')
            .where('id', id)
            .update({
                status: status
            })

            return response.json({
                code: 1,
                msg: 'Thành công'
            })
        }

        return response.json({
            code: 0,
            msg: 'missing data'
        })
    }

    async exchangeChangeStaus (request, response) {
        const { id, status } = request.body;

        if (id && status !== undefined) {
            await Database.table('exchange')
            .where('id', id)
            .update({
                enable: status
            })

            return response.json({
                code: 1,
                msg: 'Thành công'
            })
        }

        return response.json({
            code: 0,
            msg: 'missing data'
        })
    }

    async listExchangeOfUser (request, response) {
        try {
            if (request.user.id) {
                let exchange = await Database.table('exchange_settings as es')
                .join('exchange as e', 'e.id', 'es.exchange_id')
                .where('es.user_id', request.user.id)
                .select('es.id', 'e.symbol', 'e.type', 'es.strategy', 'es.status', 'e.id as exchange_id', 'es.orderAmount', 'es.orderLeverage', 'es.takeprofit', 'es.stoploss', 'es.callbackRate', 'es.dca',)
        
                for (let index = 0; index < exchange.length; index++) {
                    try {
                        exchange[index].strategy = JSON.parse(exchange[index].strategy)
                        exchange[index].dca = JSON.parse(exchange[index].dca)
                    } catch (error) {}
                }
    
                return response.json({
                    code: 1,
                    data: exchange
                })
            }
    
            return response.json({
                code: 0,
                data: [],
            })
        } catch (error) {
            return response.json({
                code: 0,
                msg: error.message
            })
        }
    }

    async listExchange (request, response) {
        const exchange = await Database.table('exchange')
        .select('id', 'symbol', 'type', 'status', 'enable', 'strategy')

        for (let index = 0; index < exchange.length; index++) {
            try {
                exchange[index].strategy = JSON.parse(exchange[index].strategy)
            } catch (error) {
            }
        }

        return response.json({
            code: 1,
            data: exchange
        })
    }

    async listExchangeEnable (request, response) {
        let exchange = await Database.table('exchange')
        .select('id', 'symbol', 'type', 'status', 'enable', 'strategy')
        .where('enable', 1)

        for (let index = 0; index < exchange.length; index++) {
            try {
                exchange[index].strategy = JSON.parse(exchange[index].strategy)
            } catch (error) {
            }
        }

        return response.json({
            code: 1,
            data: exchange
        })
    }
}