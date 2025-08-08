const userHelpers = require('../database/user-helpers')

module.exports = async (req, res, next) => {
    try {
        if (req.session.user) {
            res.locals.cartCount = await userHelpers.getCartCount(req.session.user._id) || 0
        } else {
            res.locals.cartCount = null
        }
    }
    catch (err) {
        console.error('Error fetching cart count:', err);
        res.locals.cartCount = null;
    }

    next()
}