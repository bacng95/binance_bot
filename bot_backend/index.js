const express = require('express')
const app = express()
const port = process.env.PORT || 3000

const settings = require('./lib/setting')

const route = require('./route');
const middleware = require('./middleware')

const logger = require('./lib/logger')

const services = require('./modules/services');

const Binance = require('node-binance-api');
const binance = new Binance().options()

try {
    
    middleware(app);
    route(app);

    // main()

    services.createTradeInstance().start()

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}\n\n`)
    })
    
} catch (error) {
    logger.error(error);
}

async function main () {
    binance.setOption('test', true)
    binance.setOption('APIKEY', 'd33b81fac21a8d02e573dff3c0a0091702992420ffd766e0f39f6282f3fdb234')
    binance.setOption('APISECRET', '1aff3037ee6d8c2d887592e55c1db5c0765630000b88bc58253a2faf70b0931a')

    const futuresAccount = await binance.futuresAccount()
    const futuresAllOrders = await binance.futuresAllOrders()

    // const newMarginSignal = (res) => {
    //     console.log('newMarginSignal: ', res);
    // };

    // const newSubscribedSignal = (res) => {
    //     console.log('newSubscribedSignal: ', res);
    // };

    // const newAccountSignal = (res) => {
    //     console.log('newAccountSignal: ', res);
    // };

    // const newOrderSignal = (res) => {
    //     console.log('newOrderSignal: ', res);
    // };

    // binance.websockets.userFutureData(
    //     newMarginSignal,
    //     newAccountSignal,
    //     newOrderSignal,
    //     newSubscribedSignal
    // );

    // for (let index = 0; index < futuresAccount.positions.length; index++) {
    //     const element = futuresAccount.positions[index];
    //     if (parseFloat(element.entryPrice) != 0) {
    //         console.log(element)
    //     }
    // }
    
    console.info(futuresAccount);
    console.info(futuresAllOrders);
}