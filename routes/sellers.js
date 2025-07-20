var express = require('express');
var router = express.Router();
const path = require('path')
var productHelpers = require('../database/product-helpers');
const { Timestamp } = require('mongodb');
const fs = require('fs');
const sellerHelpers = require('../database/seller-helpers');

const verifyLogin = (req, res, next) => {
  if (req.session.sellerLoggedIn) {
    next()
  } else {
    res.redirect('/seller/login')
  }
}

/* GET sellers page. */
router.get('/', verifyLogin, function (req, res, next) {
  productHelpers.getSellerProducts(req.session.seller._id)
    .then((products) => {
      res.render('seller/manage-products', { seller: req.session.seller, products });
    })
    .catch((err) => {
      console.log('Error getting products :', err)
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
      res.redirect('/seller')
    })
    .catch((err) => {
      if (err = 'Email already exists') {
        req.session.sellerLoginErr = 'Email already exist! 🤩, Please login here:'
        res.redirect('/seller/login')
      }
      else if (err = 'Passwords do not match') {
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
      res.redirect('/seller')
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

router.get('/profile', (req, res) => {
  res.render('seller/profile', { seller: req.session.seller })
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
    res.render('seller/add-product', { seller: req.session.seller, error: 'Failed to upload product images or save product.' })
  }
})

router.get('/edit-product/:id', (req, res) => {
  productHelpers.getProductDetails(req.params.id)
    .then((product) => {
      res.render('seller/edit-product', { product, seller: req.session.seller })
    })
    .catch((err) => {
      console.log(err)
      res.redirect('/seller')
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
      console.log(err)
      res.redirect('/seller')
    })
})

router.get('/delete-product', (req, res) => {
  productHelpers.deleteProduct(req.query.id, req.session.seller._id)
    .then(() => {
      res.redirect('/seller')
    })
    .catch((err) => {
      console.log(err)
      res.redirect('/seller')
    })
})

router.get('/orders', verifyLogin, async (req, res) => {
  try {
    const orders = await sellerHelpers.getOrders(req.session.seller._id)
    res.render('seller/orders', { orders, seller: req.session.seller })
  }
  catch (err) {
    console.log(err)
    res.redirect('/seller')
  }
})

router.post('/change-order-status', (req, res) => {
  sellerHelpers.changeOrderStatus(req.body._id, req.body.action)
    .then((updatedOrder) => {
      res.json(updatedOrder)
    })
    .catch((err) => {
      console.log(err)
      res.redirect('/')
    })
})

router.get('/products', (req, res) => {
  res.render('seller/products', { seller: req.session.seller })
})

router.get('/stats', (req, res) => {
  res.render('seller/stats', { seller: req.session.seller })
})

router.get('/users', (req, res) => {
  res.render('seller/users', { seller: req.session.seller })
})

module.exports = router;
