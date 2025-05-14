var express = require('express');
var router = express.Router();
const productHelpers = require('../database/product-helpers')
const userHelpers = require('../database/user-helpers')

const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', function (req, res, next) {
  const user = req.session.user
  productHelpers.getProducts()
    .then((products) => {
      res.render('user/view-products', { products, user, admin: false })
    })
    .catch((err) => {
      console.log('Error getting products :', err)
    })
})

router.get('/signup', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/signup')
  }
})

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body)
    .then((user) => {
      req.session.loggedIn = true
      req.session.user = user
      res.redirect('/')
    })
    .catch((err) => {
      console.log(err)
      if (err = 'Email already exists') {
        req.session.loginErr = 'Email already exist! 🤩, Please login here:'
        res.redirect('/login')
      } else {
        res.redirect('/signup')
      }
    })
})

router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { loginErr: req.session.loginErr })
    req.session.loginErr = false
  }
})

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body)
    .then((user) => {
      req.session.loggedIn = true
      req.session.user = user
      res.redirect('/')
    })
    .catch((err) => {
      req.session.loginErr = 'Invalid username or password! 😞'
      res.redirect('/login')
    })
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/add-to-cart/:id', verifyLogin, async (req, res) => {
  try {
    const res = await userHelpers.addToCart(req.params.id, req.session.user._id)
    const cartList = await userHelpers.getCartItems(req.session.user._id)

    res.redirect('/cart', { cartList })
  }
  catch (err) {
    console.log('Error adding product to the cart :', err)
    res.redirect('/')
  }
})

router.get('/cart', verifyLogin, (req, res) => {
  res.render('user/cart')
})

router.get('/wishlist', verifyLogin, (req, res) => {
  res.render('user/wishlist')
})

router.get('/orders', verifyLogin, (req, res) => {
  res.render('user/orders')
})

module.exports = router;