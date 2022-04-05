const redis = require('redis')

module.exports = class {
    constructor () {
        this.client = null
        this.host = '127.0.0.1'
        this.port = 6379

        this.connect()
    }

    set (key, data) {
        try {
            this.client.set(key, JSON.stringify(data))
        } catch (error) {
            console.log(error)
        }
    }

    async get (key) {
        try {
            const data = await this.client.get(key)
            if (data) {
                return JSON.parse(data)
            }
        } catch (error) {
            console.log(error)
        }

        return false;
    }

    async connect () {
        this.client = redis.createClient({
            url: `redis://${this.host}:${this.port}`
        })

        await this.client.connect()
    }
}