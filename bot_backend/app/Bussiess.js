const Database = require('../lib/database');
const logger = require('../lib/logger');

module.exports = {

    async updateEnableExchange({req, res}) {
        try {

            let { id, status } = req.body;

            status = parseInt(status)

            if (id && status !== undefined) {
                const exchange = await Database.table('exchange')
                .where('id', id)
                .first()

                // if (exchange) {
                //     if (exchange.enable != status) {
                //         if (exchange.type === 'FUTURE') {
                //             if (status) {
                //                 binance.futureSubscribe(exchange.symbol, '5m')
                //             } else {
                //                 binance.futureUnSubscribe(exchange.symbol, '5m')
                //             }
                //         }

                //         if (exchange.type === 'SPOT') {
                //             if (status) {
                //                 binance.spotSubscribe(exchange.symbol, '5m')
                //             } else {
                //                 binance.spotUnSubscribe(exchange.symbol, '5m')
                //             }
                //         }
                //     }

                //     await Database.table('exchange')
                //     .where('id', exchange.id)
                //     .update({
                //         enable: status
                //     })


                //     return res.json({
                //         code: 1,
                //         msg: 'Success !'
                //     })
                // }
            } else {
                return res.json({
                    code: 0,
                    msg: 'missing params'
                })
            }
        } catch (error) {
            logger.error(error.message, 'Bussiness.UpdateEnableExchange')

            return res.json({
                code: 0,
                msg: 'error.message'
            })
        }
    }
}