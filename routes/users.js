var express = require('express');
var router = express.Router();
const productHelpers = require('../database/product-helpers')
const userHelpers = require('../database/user-helpers')

const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
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
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    res.render('user/signup')
  }
})

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body)
    .then((user) => {
      req.session.userLoggedIn = true
      req.session.user = user
      res.redirect('/')
    })
    .catch((err) => {
      if (err = 'Email already exists') {
        req.session.userLoginErr = 'Email already exist! 🤩, Please login here:'
        res.redirect('/login')
      } else if (err = 'Passwords do not match') {
        req.session.userLoginErr = 'Passwords do not match! ⚠️'
        res.redirect('/signup')
      } else {
        req.session.userLoginErr = 'Something went wrong! 😱, Please Try again:'
        res.redirect('/signup')
      }
    })
})

router.get('/login', (req, res) => {
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { loginErr: req.session.userLoginErr })
    req.session.userLoginErr = false
  }
})

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body)
    .then((user) => {
      req.session.userLoggedIn = true
      req.session.user = user
      res.redirect('/')
    })
    .catch((err) => {
      req.session.userLoginErr = 'Invalid email or password! 😞'
      res.redirect('/login')
    })
})

router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
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

router.post('/add-to-cart/:productId', verifyLogin, async (req, res) => {
  userHelpers.addToCart(req.params.productId, req.session.user._id)
    .then(() => {
      res.redirect('/cart')
    })
    .catch((err) => {
      console.log('Error adding product to the cart :', err)
      res.redirect('/')
    })
})

router.get('/cart', verifyLogin, async (req, res) => {
  try {
    const cartList = await userHelpers.getCartItems(req.session.user._id)
    const cartTotal = await userHelpers.getCartTotal(req.session.user._id)

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
    response.cartTotal = await userHelpers.getCartTotal(req.session.user._id)
    res.json(response)
  }
  catch (err) {
    console.log(err.message)
    res.redirect('/')
  }
})

router.post('/remove-from-cart', (req, res) => {
  userHelpers.removeFromCart(req.body.productId, req.body.cartId)
    .then(() => {
      res.json({ status: true })
    })
    .catch((err) => {
      console.log(err)
      res.redirect('/')
    })
})

router.post('/move-to-wishlist', async (req, res) => {
  try {
    await userHelpers.removeFromCart(req.body.productId, req.body.cartId)
    await userHelpers.addToWishlist(req.body.productId, req.body.userId)

    res.json({ status: true })
  }
  catch (err) {
    console.log('Error moving item to wishlist')
    res.redirect('/')
  }
})

router.post('/add-to-wishlist/:productId', async (req, res) => {
  userHelpers.addToWishlist(req.params.productId, req.session.user._id)
    .then((response) => {
      req.session.message = response.message
      res.redirect('back')
    })
    .catch((err) => {
      console.log('Error adding to wishlist :', err.message)
      res.redirect('/')
    })
})

router.get('/checkout', verifyLogin, (req, res) => {
  userHelpers.getCartTotal(req.session.user._id)
    .then((cartTotal) => {
      res.render('user/checkout', { cartTotal, userId: req.session.user._id })
    })
    .catch((err) => {
      console.log(err.message)
      res.redirect('/')
    })
})

router.post('/place-order', async (req, res) => {
  try {
    const cartTotal = await userHelpers.getCartTotal(req.session.user._id)
    const CartOverview = await userHelpers.getCartOverview(req.body.orderDetails.userId)

    const orderId = await userHelpers.placeOrder(req.body.orderDetails, CartOverview, cartTotal)

    if (req.body.orderDetails.paymentMethod === 'COD') {
      res.json({ paymentMethod: 'COD', orderId })
    }
    else if (req.body.orderDetails.paymentMethod === 'ONLINE') {
      const rzpayOrder = await userHelpers.generateRazorpay(orderId, cartTotal.final_payable)

      res.json({ paymentMethod: 'ONLINE', rzpayOrder })
    }
  }
  catch (err) {
    console.log(err.message)
    res.redirect('/')
  }
})

router.post('/verify-payment', async (req, res) => {
  try {
    await userHelpers.verifyPayment(req.body)
    await userHelpers.changeOrderStatus(req.body['rzpayOrder[receipt]'])//orderId

    res.json({ status: true })
  }
  catch (err) {
    console.log(err)
    res.redirect('back')
  }
})

router.get('/order-success-msg', (req, res) => {
  userHelpers.getOrderDetails(req.query.orderId)
    .then((data) => {
      res.render('user/order-success', { order: data, user: req.session.user })
    })
    .catch((err) => {
      console.log('Error getting order details:', err.message)
      res.redirect('/')
    })
})

router.get('/wishlist', verifyLogin, (req, res) => {
  userHelpers.getWishlist(req.session.user._id)
    .then((wishlist) => {
      res.render('user/wishlist', { user: req.session.user, wishlist })
    })
    .catch((err) => {
      console.log(err.message)
      res.redirect('/')
    })
})

router.delete('/remove-from-wishlist/:productId', (req, res) => {
  userHelpers.removeFromWishlist(req.params.productId, req.session.user._id)
    .then(() => {
      res.json({ status: true })
    })
    .catch((err) => {
      console.log(err.message)
    })
})

router.post('/move-to-cart/:productId', async (req, res) => {
  try {
    await userHelpers.removeFromWishlist(req.params.productId, req.session.user._id)
    await userHelpers.addToCart(req.params.productId, req.session.user._id)

    res.redirect('/cart')
  }
  catch (err) {
    console.log(err.message)
    res.redirect('/')
  }
})

router.get('/orders', verifyLogin, (req, res) => {
  userHelpers.getOrders(req.session.user._id)
    .then((orders) => {
      res.render('user/orders', { user: req.session.user, orders })
    })
    .catch((err) => {
      console.log(err.message)
      res.redirect('/')
    })
})

module.exports = router;