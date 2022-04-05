const jwt = require('jsonwebtoken');
const configAuth = require('../config/auth');
const Database = require('../lib/database');

module.exports = async (req, res, next) => {
    const authorization = req.headers['authorization']
    if (authorization) {
        try {
            let token = authorization.split(' ');
            if (token[0] == 'Bearer' && token[1]) {
                const decoded = jwt.verify(token[1], configAuth.JWT_KEY)
                if (decoded.id) {

                    const refreshToken = await Database.table('tokens')
                    .where('id', decoded.token)
                    .where('is_revoked', 0)
                    .where('user_id', decoded.id)
                    .first()

                    if (refreshToken) {
                        const User = await Database.table('users')
                        .where('id', decoded.id)
                        .select('id', 'email', 'role', 'phone', 'api_key', 'api_secret', 'actived', 'created_at')
                        .first();
                        
                        req.user = User;
                        return next()
                    }

                    return res.status(401).json({
                        code: 401,
                        msg: 'not authorized'
                    })
                }
            }
        } catch (error) {
            return res.status(401).json({
                code: 401,
                msg: error.message
            })
        }
    }

    return res.status(401).json({
        code: 401,
        msg: 'token missing !'
    })
}