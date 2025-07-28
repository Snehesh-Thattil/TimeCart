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
router.get('/', async (req, res, next) => {
  try {
    const products = await productHelpers.getProducts()

    let cartCount = null
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
    }
    res.render('landing', { user: req.session.user, cartCount, products })
  }
  catch (err) {
    console.log(err)
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

router.get('/profile', verifyLogin, (req, res) => {
  const message = req.session.user.message
  req.session.user.message = null

  res.render('user/profile', { user: req.session.user, message })
})

router.get('/add-new-address', verifyLogin, (req, res) => {
  const message = req.session.user.message
  const error = req.session.user.error
  req.session.user.error = null

  res.render('user/manage-address', { user: req.session.user, message, error })
})

router.post('/submit-address', verifyLogin, async (req, res) => {
  try {
    const updatedUser = await userHelpers.editUserAddress(req.body, req.session.user.email)
    req.session.user = updatedUser;

    req.session.user.message = 'Address updated successfully ✅'
    res.redirect('/profile')
  }
  catch (err) {
    req.session.user.error = (err === 'Invalid Password' ? 'Incorrect password ⚠️. Please try again...' : 'Oops! Something went wrong ⚠️. Please try again...')
    res.redirect('/add-new-address')
  }
})

router.get('/edit-address', verifyLogin, (req, res) => {
  const message = req.session.user.message
  const error = req.session.user.error

  req.session.user.message = null
  req.session.user.error = null

  res.render('user/manage-address', { currentAddress: req.session.user.address, user: req.session.user, message, error })
})

router.get('/products', async (req, res) => {
  try {
    const products = await productHelpers.getProducts()

    let cartCount = null
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
    }
    res.render('user/view-products', { products, cartCount, user: req.session.user, admin: false })
  }
  catch (err) {
    console.log('Error getting products :', err)
    res.redirect('/')
  }
})

router.get('/view-item/:id', async (req, res) => {
  try {
    const product = await productHelpers.getProductDetails(req.params.id)
    const reviews = await productHelpers.getProductReviews(req.params.id)

    // calculate average rating
    const ratingAvg = reviews.length > 0
      ? (reviews.reduce((acc, review) => acc + parseInt(review.rating), 0) / reviews.length).toFixed(1)
      : null

    res.render('user/view-item', { product, reviews, ratingAvg, user: req.session.user })
  }
  catch (err) {
    console.error('Error fetching product or reviews:', err)
    res.redirect('/')
  }
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
    const cartInfo = await userHelpers.getCartTotal(req.session.user._id)
    const orderId = await userHelpers.placeOrder(req.body.orderDetails, req.session.user, cartInfo)

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

router.get('/track-order', async (req, res) => {
  try {
    const orderDetails = await userHelpers.getProductOrder(req.query.orderId, req.query.productId)
    const productDetails = await productHelpers.getProductDetails(req.query.productId)

    res.render('user/track-order', { order: orderDetails, product: productDetails })
  }
  catch (err) {
    res.render('landing', { error: err.message })
  }
})

router.get('/review-product/:productId', verifyLogin, (req, res) => {
  productHelpers.getProductDetails(req.params.productId)
    .then((product) => {
      const ratingValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      res.render('user/review-product', { product, ratingValues })
    })
    .catch((err) => {
      res.redirect('/orders', { error: err })
    })
})

router.post('/submit-review', (req, res) => {
  console.log(req.body)

  productHelpers.addReview(req.body, req.session.user)
    .then(() => {
      res.redirect(`/view-item/${req.body.productId}`)
    })
    .catch((error) => {
      res.redirect('/', { error })
    })
})

module.exports = router;