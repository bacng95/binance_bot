module.exports = class Trade {
    constructor (userExchange, exchange, strategyManager) {
        this.userExchange = userExchange
        this.exchange = exchange
        this.strategyManager = strategyManager
    }

    init() {
        this.exchange.init()
        this.userExchange.init(this.exchange)
    }

    start () {
        this.init();

        const self = this

        setInterval(async () => {
            
            // console.log(self.exchange.symbol?.FUTURE_BNBUSDT?.candles)

            const userList = await self.userExchange.getUserSettings()
            userList.forEach(async user => {
                const exchange = self.exchange.symbol[`${user.type}_${user.symbol}`]

                if (exchange) {
                    const strategy = JSON.parse(user.strategy)
    
                    for (let index = 0; index < strategy.length; index++) {
                        const setting = strategy[index];
                        const signal = await this.strategyManager.executeStrategy(setting.strategy_name, exchange, setting.options)
                        
                        if (signal) {
                            self.userExchange.addUserSignal(user.user_id, signal, user.exchange_id, user.type)
                            // console.log(self.userExchange.getUser(user.user_id))
                        }
                    }
                }

            })
        }, 5000)
    }
}