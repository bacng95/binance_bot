const Order = require('./order');

module.exports = class UserOrders {
    constructor () {
        this.orders = {}
    }

    getOrder (user) {
        if (!user) { return {} }

        return this.orders[user]
    }

    setOrder (user, signal) {
        if (!this.orders[user]) {
            this.orders[user] = [Order.createOrder()]
        } else {
            this.orders[user].push(Order.createOrder())
        }
    }

}