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
  productHelpers.getProducts()
    .then((products) => {
      res.render('seller/manage-products', { seller: true, products });
    })
    .catch((err) => {
      console.log('Error getting products :', err)
    })
})

router.get('/signup', (req, res) => {
  res.render('seller/signup')
})

router.post('/signup', (req, res) => {
  sellerHelpers.doSignup(req.body)
    .then((seller) => {
      req.session.sellerLoggedIn = true
      req.session.seller = seller
      res.redirect('/seller')
    })
    .catch((err) => {
      console.log(err)

      if (err = 'Email already exists') {
        req.session.sellerLoginErr = 'Email already exist! 🤩, Please login here:'
        res.redirect('/seller/login')
      } else {
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
      res.redirect('/')
    })
    .catch((err) => {
      req.session.userLoginErr = 'Invalid email or password! 😞'
      res.redirect('/login')
    })
})

router.get('/logout', (req, res) => {
  req.session.seller = null
  req.session.sellerLoggedIn = false
  res.redirect('/seller')
})

router.get('/add-product', (req, res) => {
  res.render('seller/add-product')
})

router.post('/add-product', async (req, res) => {
  try {
    let images = req.files?.image
    if (!images) {
      return res.render('seller/add-product', { seller: true, error: 'Product image is required' })
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
    await productHelpers.addProduct(req.body, uploadedImages)
    res.redirect('/seller')
  }
  catch (err) {
    console.error('Error in /add-product:', err)
    res.render('seller/add-product', { seller: true, error: 'Failed to upload product images or save product.' })
  }
})

router.get('/edit-product/:id', (req, res) => {
  productHelpers.getProductDetails(req.params.id)
    .then((product) => {
      res.render('seller/edit-product', { product })
    })
    .catch((err) => {
      console.log(err)
      res.redirect('/seller')
    })
})

router.post('/submit-update/:id', (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body)
    .then(() => {
      let newImage = req.files.image
      let imagePath = path.join(__dirname, '../public/images/products/', req.params.id + '.jpeg')
      newImage.mv(imagePath, (mvErr) => {
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
  productHelpers.deleteProduct(req.query.id)
    .then((data) => {
      res.redirect('/seller')
    })
    .catch((err) => {
      console.log(err)
      res.redirect('/seller')
    })
})

router.get('/orders', (req, res) => {
  res.render('seller/orders', { seller: true })
})

router.get('/products', (req, res) => {
  res.render('seller/products', { seller: true })
})

router.get('/stats', (req, res) => {
  res.render('seller/stats', { seller: true })
})

router.get('/users', (req, res) => {
  res.render('seller/users', { seller: true })
})

module.exports = router;
