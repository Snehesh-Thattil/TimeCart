var express = require('express');
var router = express.Router();
const path = require('path')
const { Timestamp } = require('mongodb');
const fs = require('fs');
var productHelpers = require('../database/product-helpers');
const sellerHelpers = require('../database/seller-helpers');

const verifyLogin = (req, res, next) => {
  if (req.session.sellerLoggedIn) {
    return next()
  }
  if (req.method === 'POST') {
    req.session.returnTo = req.get('Referrer') || '/seller'
  } else {
    req.session.returnTo = req.originalUrl
  }

  res.redirect('/seller/login')
}

/* GET sellers page. */
router.get('/', verifyLogin, function (req, res, next) {
  sellerHelpers.getOrders(req.session.seller._id)
    .then((data) => {
      let { orders, returns } = data.reduce((acc, item) => {
        if (item.orderStatus === 'returnReq' || item.orderStatus === 'returnCompleted') {
          acc.returns.push(item)
        }
        else {
          acc.orders.push(item)
        }
        return acc
      }, { orders: [], return: [] })

      orders = orders?.slice(0, 5)
      returns = returns?.slice(0, 5)

      res.render('seller/seller-home', { orders, returns, seller: req.session.seller })
    })
    .catch((err) => {
      req.flash('error', err.message)
    })
})

router.get('/products', verifyLogin, (req, res) => {
  productHelpers.getSellerProducts(req.session.seller._id)
    .then((products) => {
      res.render('seller/manage-products', { seller: req.session.seller, products });
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.get('/signup', (req, res) => {
  if (req.session.sellerLoggedIn) {
    res.redirect('/seller')
  } else {
    res.render('seller/signup')
  }
})

router.post('/signup', (req, res) => {
  sellerHelpers.doSignup(req.body)
    .then((seller) => {
      req.session.sellerLoggedIn = true
      req.session.seller = seller

      const redirectURL = req.session.returnTo || '/'
      delete req.session.returnTo

      res.redirect(redirectURL)
    })
    .catch((err) => {
      if (err === 'Email already exists') {
        req.session.sellerLoginErr = 'Email already exist! 🤩, Please login here:'
        res.redirect('/seller/login')
      }
      else if (err === 'Passwords do not match') {
        req.session.sellerLoginErr = 'Passwords do not match! ⚠️'
        res.redirect('/seller/signup')
      }
      else {
        req.session.sellerLoginErr = 'Something went wrong! 😱, Please Try again:'
        res.redirect('/seller/signup')
      }
    })
})

router.get('/login', (req, res) => {
  if (req.session.sellerLoggedIn) {
    res.redirect('/seller')
  }
  else {
    res.render('seller/login', { loginErr: req.session.sellerLoginErr })
    req.session.sellerLoginErr = false
  }
})

router.post('/login', (req, res) => {
  sellerHelpers.doLogin(req.body)
    .then((seller) => {
      req.session.sellerLoggedIn = true
      req.session.seller = seller

      const redirectURL = req.session.returnTo || '/'
      delete req.session.returnTo

      res.redirect(redirectURL)
    })
    .catch((err) => {
      req.session.sellerLoginErr = 'Invalid email or password! 😞'
      res.redirect('/seller/login')
    })
})

router.get('/logout', (req, res) => {
  req.session.seller = null
  req.session.sellerLoggedIn = false
  res.redirect('/seller')
})

router.get('/profile', verifyLogin, (req, res) => {
  const message = req.session.seller.message
  req.session.seller.message = null

  res.render('seller/profile', { seller: req.session.seller, message })
})

router.get('/add-new-location', verifyLogin, (req, res) => {
  const message = req.session.seller.message
  const error = req.session.seller.error
  req.session.seller.error = null

  res.render('seller/manage-location', { seller: req.session.seller, message, error })
})

router.post('/submit-location', verifyLogin, async (req, res) => {
  try {
    const updatedSeller = await sellerHelpers.editSellerLocation(req.body, req.session.seller.email)
    req.session.seller = updatedSeller;

    req.session.seller.message = 'Location updated successfully ✅'
    res.redirect('/seller/profile')
  }
  catch (err) {
    req.session.seller.error = (err === 'Invalid Password' ? 'Incorrect password ⚠️. Please try again...' : 'Oops! Something went wrong ⚠️. Please try again...')
    res.redirect('/seller/add-new-location')
  }
})

router.get('/edit-location', verifyLogin, (req, res) => {
  const message = req.session.seller.message
  const error = req.session.seller.error

  req.session.seller.message = null
  req.session.seller.error = null

  res.render('seller/manage-location', { currLocation: req.session.seller.location, seller: req.session.seller, message, error })
})

router.get('/edit-profile-info', verifyLogin, (req, res) => {
  res.render('seller/edit-profileInfo', { seller: req.session.seller })
})

router.post('/submit-profileInfo', async (req, res) => {
  try {
    let fileName

    if (req.files && req.files.sellerPhoto) {
      const sellerImagePath = path.join(__dirname, '../public/images/sellers/')

      if (!fs.existsSync(sellerImagePath)) {
        fs.mkdirSync(sellerImagePath)
      }

      const sellerPhoto = req.files.sellerPhoto
      const ext = path.extname(sellerPhoto.name)
      fileName = 'seller-' + req.session.seller._id + ext
      const fullPath = path.join(sellerImagePath, fileName)

      await new Promise((resolve, reject) => {
        sellerPhoto.mv(fullPath, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }

    const newSellerData = await sellerHelpers.editProfileInfo(req.body, fileName, req.session.seller._id)
    req.session.seller = newSellerData

    res.render('seller/profile', { seller: req.session.seller, message: 'Profile Updated Successfully ✅' })
  }
  catch (err) {
    console.error(err)
    res.render('seller/profile', { error: 'Something Went Wrong! ⚠️. Try again' })
  }
})

router.post('/change-password', (req, res) => {
  console.log(req.body)
  sellerHelpers.changePassword(req.body, req.session.seller._id)
    .then(() => {
      res.render('seller/profile', { seller: req.session.seller, message: 'Password Updated Successfully ✅' })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.render('seller/profile', { error: err })
    })
})

router.get('/add-product', verifyLogin, (req, res) => {
  res.render('seller/add-product', { seller: req.session.seller })
})

router.post('/add-product', async (req, res) => {
  try {
    let images = req.files?.image
    if (!images) {
      return res.render('seller/add-product', { error: 'Product image is required', seller: req.session.seller })
    }

    images = Array.isArray(images) ? images : [images]

    // Helper function for unique filenames
    const createName = (imgName) => {
      const randomNum = Math.floor(Math.random() * 9999)
      const timestamp = Math.floor(Date.now() / 1000)
      const nameWithoutExt = path.parse(imgName).name
      const cleanName = nameWithoutExt.replace(/\s+/g, '_')
      return `${cleanName}-${timestamp}_${randomNum}`
    }

    // Ensure upload directory exists
    const productImagePath = path.join(__dirname, '../public/images/products/')
    if (!fs.existsSync(productImagePath)) {
      fs.mkdirSync(productImagePath, { recursive: true })
    }

    // Upload all images
    const uploadPromises = images.map((img) => {
      const imgName = createName(img.name)
      const ext = path.extname(img.name)
      const fullPath = path.join(productImagePath, imgName + ext)

      return new Promise((resolve, reject) => {
        img.mv(fullPath, (err) => {
          if (err) reject({ name: img.name, error: err })
          else resolve(imgName + ext)
        })
      })
    })

    const uploadedImages = await Promise.all(uploadPromises)
    await productHelpers.addProduct(req.body, uploadedImages, req.session.seller)
    res.redirect('/seller')
  }
  catch (err) {
    console.error('Error in /add-product:', err)
    req.flash('error', err.message)
    res.redirect('back')
  }
})

router.get('/edit-product/:id', (req, res) => {
  productHelpers.getProductDetails(req.params.id)
    .then((product) => {
      res.render('seller/edit-product', { product, seller: req.session.seller })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.post('/submit-update/:id', (req, res) => {
  let newImages = req.files.image
  newImages = Array.isArray(images) ? images : [images]

  productHelpers.updateProduct(req.params.id, req.body, newImages, req.session.seller._id)
    .then(() => {
      let imagePath = path.join(__dirname, '../public/images/products/', req.params.id + '.jpeg')

      newImages.mv(imagePath, (mvErr) => {
        if (!mvErr) {
          res.redirect('/seller')
        } else {
          console.log('Uploading image failed!')
          res.redirect('/seller')
        }
      })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.get('/delete-product', (req, res) => {
  productHelpers.deleteProduct(req.query.id, req.session.seller._id)
    .then(() => {
      res.redirect('/seller')
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.get('/orders', verifyLogin, async (req, res) => {
  sellerHelpers.getOrders(req.session.seller._id)
    .then((data) => {
      const orders = data.filter((item) => item.orderStatus !== 'returnReq' && item.orderStatus !== 'returnCompleted')
      res.render('seller/orders', { orders, seller: req.session.seller })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.post('/change-order-status', (req, res) => {
  sellerHelpers.changeOrderStatus(req.body._id, req.body.action)
    .then((updatedOrder) => {
      res.json(updatedOrder)
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

router.get('/returns', verifyLogin, (req, res) => {
  sellerHelpers.getOrders(req.session.seller._id)
    .then((data) => {
      const returns = data.filter((item) => item.orderStatus === 'returnReq' || item.orderStatus === 'returnCompleted')
      res.render('seller/returns', { returns, seller: req.session.seller })
    })
    .catch((err) => {
      req.flash('error', err.message)
      res.redirect('back')
    })
})

module.exports = router;
