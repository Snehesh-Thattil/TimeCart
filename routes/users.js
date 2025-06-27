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

router.post('/add-to-cart', async (req, res) => {
  // verifyLogin temporarily disabled

  userHelpers.addToCart(req.body)
    .then((response) => {
      res.json(response)
    })
    .catch((err) => {
      console.log('Error adding product to the cart :', err)
      res.redirect('/')
    })
})

router.get('/cart', verifyLogin, async (req, res) => {
  const data = {
    userId: req.session.user._id
  }

  try {
    const cartList = await userHelpers.getCartItems(req.session.user._id)
    const cartTotal = await userHelpers.getCartTotal(data)

    res.render('user/cart', { user: req.session.user, cartList, cartTotal })
  }
  catch (err) {
    console.log(err.message)
    res.redirect('/')
  }
})

router.post('/change-product-qnty', async (req, res) => {
  try {
    const response = await userHelpers.changeProductQnty(req.body)
    response.cartTotal = await userHelpers.getCartTotal(req.body)
    res.json(response)
  }
  catch (err) {
    console.log(err.message)
    res.redirect('/')
  }
})

router.post('/remove-from-cart', (req, res) => {
  userHelpers.removeFromCart(req.body)
    .then(() => {
      res.json({ status: true })
    })
    .catch((err) => {
      console.log(err)
      res.redirect('/')
    })
})

router.get('/view-item/:id', (req, res) => {
  productHelpers.getProductDetails(req.params.id)
    .then((data) => {
      res.render('user/view-item', { product: data, user: req.session.user })
    })
    .catch((err) => {
      console.log(err.message)
      res.redirect('/')
    })
})

router.post('/move-to-wishlist', async (req, res) => {
  try {
    await userHelpers.removeFromCart(req.body)
    await userHelpers.addToWishlist(req.body)

    res.json({ status: true })
  }
  catch (err) {
    console.log('Error moving item to wishlist')
    res.redirect('/')
  }
})

router.get('/checkout', verifyLogin, (req, res) => {
  const data = {
    userId: req.session.user._id
  }
  userHelpers.getCartTotal(data)
    .then((cartTotal) => {
      res.render('user/checkout', { cartTotal, userId: data.userId })
    })
    .catch((err) => {
      console.log(err.message)
      res.redirect('/')
    })
})

router.post('/place-order', async (req, res) => {
  try {
    const cartTotal = await userHelpers.getCartTotal(req.body.orderDetails)
    const CartOverview = await userHelpers.getCartOverview(req.body.orderDetails.userId)

    await userHelpers.placeOrder(req.body.orderDetails, CartOverview, cartTotal)
    res.json({ status: true })
  }
  catch (err) {
    console.log(err.message)
    res.redirect('/')
  }
})

router.get('/order-success-msg', (req,res)=>{
  res.render('user/order-success')
})

router.get('/wishlist', verifyLogin, (req, res) => {
  res.render('user/wishlist', { user: req.session.user })
})

router.get('/orders', verifyLogin, (req, res) => {
  res.render('user/orders', { user: req.session.user })
})

module.exports = router;