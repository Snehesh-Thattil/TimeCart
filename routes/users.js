var express = require('express');
var router = express.Router();
const productHelpers = require('../database/product-helpers')
const userHelpers = require('../database/user-helpers')
const fs = require('fs')
const path = require('path')

const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    return next()
  }

  if (req.method === 'POST') {
    req.session.returnTo = req.get('Referrer') || '/'
  } else {
    req.session.returnTo = req.originalUrl
  }

  res.redirect('/login')
}

/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const allProducts = await productHelpers.getProducts()

    let { analog, smartwatch, under5k } = allProducts.reduce((acc, item) => {
      if (item.type === 'analog') {
        acc.analog.push(item)
      }
      if (item.type === 'smartwatch') {
        acc.smartwatch.push(item)
      }
      if (parseInt(item.selling_price) <= 5000) {
        acc.under5k.push(item)
      }

      return acc = {
        analog: acc.analog.slice(0, 10),
        smartwatch: acc.smartwatch.slice(0, 10),
        under5k: acc.under5k.slice(0, 10)
      }

    }, { analog: [], smartwatch: [], under5k: [] })

    const products = { analog, smartwatch, under5k }

    res.render('landing', { user: req.session.user, products })
  }
  catch (err) {
    req.flash('error', err.message)
    res.redirect('back')
  }
})

router.get('/search-products', async (req, res) => {
  try {
    let products = await productHelpers.getProducts()
    const searchTerm = req.query.search?.toLowerCase() || ''

    if (searchTerm) {
      products = products.filter((item) =>
        item.product_name.toLowerCase().includes(searchTerm) ||
        item.brand_name.toLowerCase().includes(searchTerm) ||
        item.type.toLowerCase().includes(searchTerm)
      )
    }

    res.render('user/view-products', { products })
  }
  catch (err) {
    req.flash('error', err.message)
    res.redirect('back')
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

      const redirectURL = req.session.returnTo || '/'
      delete req.session.returnTo

      res.redirect(redirectURL)
    })
    .catch((err) => {
      if (err === 'Email already exists') {
        req.session.userLoginErr = 'Email already exist! 🤩, Please login here:'
        res.redirect('/login')
      } else if (err === 'Passwords do not match') {
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

      const redirectURL = req.session.returnTo || '/'
      delete req.session.returnTo

      res.redirect(redirectURL)
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
  req.session.user.message = null

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

router.get('/edit-profile-info', verifyLogin, (req, res) => {
  res.render('user/edit-profileInfo', { user: req.session.user })
})

router.post('/submit-profileInfo', async (req, res) => {
  try {
    let fileName

    if (req.files && req.files.userPhoto) {
      const userImagePath = path.join(__dirname, '../public/images/users/')

      if (!fs.existsSync(userImagePath)) {
        fs.mkdirSync(userImagePath)
      }

      const userPhoto = req.files.userPhoto
      const ext = path.extname(userPhoto.name)
      fileName = 'user-' + req.session.user._id + ext
      const fullPath = path.join(userImagePath, fileName)

      await new Promise((resolve, reject) => {
        userPhoto.mv(fullPath, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }

    const newUserData = await userHelpers.editProfileInfo(req.body, fileName, req.session.user._id)
    req.session.user = newUserData

    res.render('user/profile', { user: req.session.user, message: 'Profile Updated Successfully ✅' })
  }
  catch (err) {
    console.log('Error editing profileInfos :', err.message)
    res.render('user/profile', { error: 'Something Went Wrong! ⚠️. Try again' })
  }
})

router.post('/change-password', (req, res) => {
  userHelpers.changePassword(req.body, req.session.user._id)
    .then(() => {
      res.render('user/profile', { message: 'Password Changed Successfully ✅' })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.render('user/profile', { error: err })
    })
})

router.get('/display-all-products', async (req, res) => {
  try {
    const products = await productHelpers.getProducts()

    res.render('user/view-products', { products, user: req.session.user })
  }
  catch (err) {
    req.flash('error', err.message)
    res.redirect('back')
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
    req.flash('error', err.message)
    res.redirect('back')
  }
})

router.post('/add-to-cart/:productId', verifyLogin, async (req, res) => {
  userHelpers.addToCart(req.params.productId, req.session.user._id)
    .then(() => {
      req.flash('success', 'Product added to cart')
      res.redirect('/cart')
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.get('/cart', verifyLogin, async (req, res) => {
  try {
    const cartList = await userHelpers.getCartItems(req.session.user._id)
    const cartTotal = await userHelpers.getCartTotal(req.session.user._id)

    res.render('user/cart', { user: req.session.user, cartList, cartTotal })
  }
  catch (err) {
    req.flash('error', err.message)
    res.redirect('back')
  }
})

router.post('/change-product-qnty', async (req, res) => {
  try {
    const response = await userHelpers.changeProductQnty(req.body)
    response.cartTotal = await userHelpers.getCartTotal(req.session.user._id)
    res.json(response)
  }
  catch (err) {
    req.flash('error', err.message)
    res.redirect('back')
  }
})

router.post('/remove-from-cart', (req, res) => {
  userHelpers.removeFromCart(req.body.productId, req.body.cartId)
    .then(() => {
      res.json({ status: true })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.post('/move-to-wishlist', async (req, res) => {
  try {
    await userHelpers.removeFromCart(req.body.productId, req.body.cartId)
    await userHelpers.addToWishlist(req.body.productId, req.body.userId)

    res.json({ status: true })
  }
  catch (err) {
    req.flash('error', err.message)
    res.redirect('back')
  }
})

router.post('/add-to-wishlist/:productId', async (req, res) => {
  userHelpers.addToWishlist(req.params.productId, req.session.user._id)
    .then((response) => {
      req.session.message = response.message
      req.flash('success', 'Product added to your wishlist')
      res.redirect('back')
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.get('/checkout', verifyLogin, (req, res) => {
  userHelpers.getCartTotal(req.session.user._id)
    .then((cartTotal) => {
      res.render('user/checkout', { cartTotal, userId: req.session.user._id })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
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
      const rzpayOrder = await userHelpers.generateRazorpay(orderId, cartInfo.final_payable)

      res.json({ paymentMethod: 'ONLINE', rzpayOrder })
    }
  }
  catch (err) {
    req.flash('error', 'Oops! Something wrong happened 😱')
    res.redirect('back')
  }
})

router.post('/verify-payment', async (req, res) => {
  try {
    await userHelpers.verifyPayment(req.body)
    await userHelpers.changeOrderStatus(req.body['rzpayOrder[receipt]'])//orderId

    res.json({ status: true })
  }
  catch (err) {
    req.flash('error', err.message)
    res.redirect('back')
  }
})

router.get('/order-success-msg', (req, res) => {
  userHelpers.getOrderDetails(req.query.orderId)
    .then((data) => {
      res.render('user/order-success', { order: data, user: req.session.user, success_msg: 'Order successfully placed ✅' })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.get('/wishlist', verifyLogin, (req, res) => {
  userHelpers.getWishlist(req.session.user._id)
    .then((wishlist) => {
      res.render('user/wishlist', { user: req.session.user, wishlist })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.delete('/remove-from-wishlist/:productId', (req, res) => {
  userHelpers.removeFromWishlist(req.params.productId, req.session.user._id)
    .then(() => {
      res.json({ status: true })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.post('/move-to-cart/:productId', async (req, res) => {
  try {
    await userHelpers.removeFromWishlist(req.params.productId, req.session.user._id)
    await userHelpers.addToCart(req.params.productId, req.session.user._id)

    res.redirect('/cart')
  }
  catch (err) {
    req.flash('error', err.message)
    res.redirect('back')
  }
})

router.get('/orders', verifyLogin, (req, res) => {
  userHelpers.getOrders(req.session.user._id)
    .then((orders) => {
      res.render('user/orders', { user: req.session.user, orders })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.get('/track-order', verifyLogin, async (req, res) => {
  try {
    const orderDetails = await userHelpers.getProductOrder(req.query.orderId, req.query.productId)
    const productDetails = await productHelpers.getProductDetails(req.query.productId)

    // Check return eligibility  
    const deliveredTimestamp = orderDetails?.date?.deliveredTimestamp
    let returnPossible = false

    if (deliveredTimestamp) {
      const nowMidnight = new Date()
      nowMidnight.setHours(0, 0, 0, 0)
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
      returnPossible = nowMidnight.getTime() - deliveredTimestamp <= sevenDaysInMs
    }

    res.render('user/track-order', { order: orderDetails, product: productDetails, returnPossible })
  }
  catch (err) {
    req.flash('error', err.message)
    res.redirect('back')
  }
})

router.get('/cancel-order', (req, res) => {
  userHelpers.cancelOrder(req.query.orderId, req.query.productId)
    .then(() => {
      req.flash('success', 'Your order has been cancelled 😔')
      res.redirect('back')
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.get('/return-product', (req, res) => {
  userHelpers.returnProduct(req.query.orderId, req.query.productId)
    .then(() => {
      req.flash('success', 'Return request has been successfully placed 🚚')
      res.redirect('back')
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.get('/cancel-return', verifyLogin, (req, res) => {
  userHelpers.cancelReturn(req.query.orderId, req.query.productId)
    .then(() => {
      req.flash('success', 'Successfully abandoned returning of the product 😄')
      res.redirect('back')
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })

})

router.get('/review-product/:productId', verifyLogin, (req, res) => {
  productHelpers.getProductDetails(req.params.productId)
    .then((product) => {
      const ratingValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      res.render('user/review-product', { product, ratingValues })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.post('/submit-review', (req, res) => {
  console.log(req.body)

  productHelpers.addReview(req.body, req.session.user)
    .then(() => {
      res.redirect(`/view-item/${req.body.productId}`)
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

module.exports = router;