module.exports = (req, res, next) => {
    try {
        const allowedMethods = [
            'OPTIONS',
            'HEAD',
            'CONNECT',
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'PATCH',
        ];
    
        if (!allowedMethods.includes(req.method)) {
            res.status(405).send(`${req.method} not allowed.`);
        }
    
        next();
    } catch (error) {
        return res.json({
            code: 0,
            msg: error.message
        })
    }
}