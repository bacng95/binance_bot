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
                    msg: 'Thành công'
                })
            } else {
                return response.json({
                    code: 0,
                    msg: 'Email đã được đăng ký, hãy sử dụng email khác'
                })
            }
        }

        return response.json({
            code: 0,
            msg: 'Thiếu dữ liệu'
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
                            msg: 'Tài khoản chưa kích hoạt hoặc đã bị vô hiệu. Hãy liên hệ với quản trị viên để biết thêm thông tin !'
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
                        msg: 'Thành công',
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
                msg: 'Xác nhận không khớp'
            })
        }
        
        return response.json({
            code: 0,
            msg: 'Thiếu dữ liệu'
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
                    msg: 'Thành công',
                    data: {
                        accessToken: token
                    }
                })
            }

            return response.json({
                code: 0,
                msg: 'Không thành công'
            })

        }

        return response.json({
            code: 0,
            msg: "Thiếu dữ liệu"
        })
    }
}