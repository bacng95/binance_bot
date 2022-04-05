
const Database = require('../lib/database')
const cacheDefine = require('./cache_define')
const User = require('./user');

module.exports = class UserExchange {
    constructor(cache, event) {
        this.cache = cache,
        this.event = event
        this.user = {}
    }

    async init(exchange) {
        const listUser = await this.listUser();
        listUser.forEach(user => {
            this.user[user.id] = User.createUser(user, this.cache, this.event, exchange)
        });
    }
    
    getUser(id) {
        return this.user[id] || {}
    }

    addUserSignal (userId, signal, exchange_settings_id, exchange_type) {
        if (!userId || !userId) { return; }

        if (this.user[userId]) {
            this.user[userId].pushSignal(exchange_settings_id, exchange_type, signal)
        }
    }

    async listUser () {
        return Database.table('users')
        .where('actived', 1)
        .select('id', 'email', 'phone', 'api_key', 'api_secret')
    }


    async userSettingsSetCache (userSettings) {
        userSettings.forEach(user_s => {
            this.cache?.set(`EXCHANGE_SETTING_${user_s.user_id}_${user_s.symbol}_${user_s.type}`, user_s)
        })
    }


    /**
     * Nhả setting của các cặp tiền
     */
    async getUserSettings () {
        const userSettings = await Database.table('exchange_settings as exs')
        .join('users as u', 'u.id', 'exs.user_id')
        .join('exchange as ex', 'ex.id', 'exs.exchange_id')
        .where('exs.status', 1)
        .where('ex.enable', 1)
        .select('exs.*', 'exs.id as setting_id', 'u.id as user_id', 'u.email as user_email', 'ex.symbol', 'ex.type')

        this.userSettingsSetCache(userSettings)

        return userSettings
    }
    
}