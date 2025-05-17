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
router.get('/', async function (req, res, next) {
  const user = req.session.user
  let cartCount = null

  try {
    const products = await productHelpers.getProducts()

    if (user) {
      cartCount = await userHelpers.getCartCount(user._id)
    }

    res.render('user/view-products', { products, cartCount, user, admin: false })
  }
  catch (err) {
    console.log('Error getting products :', err)
  }
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

router.get('/cart', verifyLogin, (req, res) => {
  userHelpers.getCartItems(req.session.user._id)
    .then((cartList) => {
      res.render('user/cart', { user: req.session.user, cartList })
    })
    .catch((err) => {
      console.log(err)
      res.redirect('/')
    })
})

router.get('/add-to-cart/:id', async (req, res) => {
  // verifyLogin // is temporarily disabled

  try {
    await userHelpers.addToCart(req.params.id, req.session.user._id)
    const cartList = await userHelpers.getCartItems(req.session.user._id)
    const cartCount = await userHelpers.getCartCount(req.session.user._id)

    // res.render('user/cart', { user: req.session.user, cartList, cartCount })
    res.json({ status: true })
  }
  catch (err) {
    console.log('Error adding product to the cart :', err)
    res.redirect('/')
  }
})

router.get('/wishlist', verifyLogin, (req, res) => {
  res.render('user/wishlist', { user: req.session.user })
})

router.get('/orders', verifyLogin, (req, res) => {
  res.render('user/orders', { user: req.session.user })
})

module.exports = router;