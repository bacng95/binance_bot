const Database = require("../lib/database");
const jwt = require('jsonwebtoken');
const configAuth = require('../config/auth')

const bcrypt = require('bcrypt')
const passwordSaltRounds = 6;

const { randomUUID, createHash } = require('crypto');

module.exports = class UserController {

    async updateSettings (request, response) {
        try {
            if (request.user.id) {
                const { apiKey, apiSecret } = request.body

                const userInfo = await Database.table('users')
                .where('id', request.user.id)
                .select('email', 'phone', 'api_key', 'api_secret')
                .first()

                const dataUpdate = Object.assign(userInfo, {
                    api_key: apiKey,
                    api_secret: apiSecret
                })

                await Database.table('users')
                .where('id', request.user.id)
                .update(dataUpdate)

                return response.json({
                    code: 1,
                    msg: 'Success !'
                })
            }
        } catch (error) {
            return response.json({
                code: 0,
                msg: error.message
            })
        }
    }

    async getSetting (request, response) {
        try {
            if (request.user.id) {
                const userInfo = await Database.table('users')
                .where('id', request.user.id)
                .select('email', 'phone', 'api_key', 'api_secret')
                .first()

                return response.json({
                    code: 1,
                    data: userInfo
                })
            }
        } catch (error) {
            return response.json({
                code: 0,
                msg: error.message
            })
        }

        return response.json({
            code: 0,
            msg: '',
            data: ''
        })
    }

    async register (request, response) {
        const { email, password } = request.body;

        if (email && password) {
            const checkUser = await Database.table('users')
            .where('email', email)
            .first()

            if (!checkUser) {
                const salt = await bcrypt.genSalt(passwordSaltRounds)
                const passHash = await bcrypt.hash(password, salt)
                const user = await Database.table('users')
                .insert({
                    email,
                    password: passHash
                })

                return response.json({
                    code: 1,
                    data: user[0],
                    msg: 'Th??nh c??ng'
                })
            } else {
                return response.json({
                    code: 0,
                    msg: 'Email ???? ???????c ????ng k??, h??y s??? d???ng email kh??c'
                })
            }
        }

        return response.json({
            code: 0,
            msg: 'Thi???u d??? li???u'
        })
    }
    

    async login (request, response) {
        const { email, password } = request.body

        if (email && password) {
            const user = await Database.table('users')
            .where('email', email)
            .first();

            if (user) {
                const passCompare = await bcrypt.compare(password, user.password);
                if (passCompare) {
                    
                    if (!user.actived) {
                        return response.json({
                            code: 0,
                            msg: 'T??i kho???n ch??a k??ch ho???t ho???c ???? b??? v?? hi???u. H??y li??n h??? v???i qu???n tr??? vi??n ????? bi???t th??m th??ng tin !'
                        })
                    }
                    // Create refreshToken
                    const jwtToken = createHash('md5').update(randomUUID()).digest('hex')
                    const tokenInsert = await Database.table('tokens')
                    .insert({
                        user_id: user.id,
                        token: jwtToken,
                    })

                    const token = jwt.sign({
                        id: user.id,
                        email: user.email,
                        token: tokenInsert[0]
                    }, configAuth.JWT_KEY, { 
                        algorithm: configAuth.JWT_ALGORITHM,
                        expiresIn: configAuth.JWT_EXPIRES
                    });

                    return response.json({
                        code: 1,
                        msg: 'Th??nh c??ng',
                        data: {
                            userData: {
                                email: user.email,
                                user_id: user.id,
                                role: user.role,
                                ability: [{action: "manage", subject: "all"}],
                            },
                            token: {
                                accessToken: token,
                                refreshToken: jwtToken
                            }
                        }
                    })
                }
            }

            return response.json({
                code: 0,
                msg: 'X??c nh???n kh??ng kh???p'
            })
        }
        
        return response.json({
            code: 0,
            msg: 'Thi???u d??? li???u'
        })
    }


    async refreshToken (request, response) {
        const { refreshToken } =  request.body;

        if (refreshToken) {
            const checkRefreshToken = await Database.table('tokens')
            .where('token', refreshToken)
            .where('is_revoked', 0)
            .first()

            if (checkRefreshToken) {
                const user = await Database.table('users')
                .where('id', checkRefreshToken.user_id)
                .first()

                const token = jwt.sign({
                    id: user.id,
                    email: user.email,
                    token: checkRefreshToken.id
                }, configAuth.JWT_KEY, { 
                    algorithm: configAuth.JWT_ALGORITHM,
                    expiresIn: configAuth.JWT_EXPIRES
                });

                return response.json({
                    code: 1,
                    msg: 'Th??nh c??ng',
                    data: {
                        accessToken: token
                    }
                })
            }

            return response.json({
                code: 0,
                msg: 'Kh??ng th??nh c??ng'
            })

        }

        return response.json({
            code: 0,
            msg: "Thi???u d??? li???u"
        })
    }
}