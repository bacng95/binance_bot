const Bussiness = require('./app/Bussiess')
const UserController = new (require('./app/UserController'))
const ExchangeController = new (require('./app/ExchangeController'))

const jwtMiddleware = require('./middleware/auth')

module.exports = (app) => {

    app.post('/auth/register', UserController.register)
    app.post('/auth/login', UserController.login)
    app.post('/auth/refresh-token', UserController.refreshToken)

    app.get('/user/settings', jwtMiddleware, UserController.getSetting)
    app.post('/user/settings', jwtMiddleware, UserController.updateSettings)


    app.get('/exchange/list', jwtMiddleware, ExchangeController.listExchange)
    app.get('/exchange/list-enable', jwtMiddleware, ExchangeController.listExchangeEnable)
    app.post('/exchange/change-status', jwtMiddleware, ExchangeController.exchangeChangeStaus)
    app.post('/exchange/edit', jwtMiddleware, ExchangeController.exchangeEdit)

    
    app.post('/exchange-setting/add', jwtMiddleware, ExchangeController.exchangeSettingAdd)
    app.post('/exchange-setting/edit', jwtMiddleware, ExchangeController.exchangeSettingEdit)
    app.get('/exchange-setting/user-list', jwtMiddleware, ExchangeController.listExchangeOfUser)
    app.post('/exchange-setting/change-status', jwtMiddleware, ExchangeController.exchangeUserChangeStaus)

}