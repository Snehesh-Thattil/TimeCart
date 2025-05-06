var express = require('express');
var router = express.Router();
const path = require('path')
var productHelpers = require('../database/product-helpers');
const { Timestamp } = require('mongodb');
const fs = require('fs')

/* GET admins page. */
router.get('/', function (req, res, next) {
  productHelpers.getProducts()
    .then((products) => {
      res.render('admin/manage-products', { admin: true, products });
    })
    .catch((err) => {
      console.log('Error getting products :', err)
    })
})

router.get('/add-product', (req, res) => {
  res.render('admin/add-product')
})

router.post('/add-product', async (req, res) => {
  try {
    let images = req.files?.image
    if (!images) {
      return res.render('admin/add-product', { admin: true, error: 'Product image is required' })
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
    res.redirect('/admin')
  }
  catch (err) {
    console.error('Error in /add-product:', err)
    res.render('admin/add-product', { admin: true, error: 'Failed to upload product images or save product.' })
  }
})

router.get('/edit-product/:id', (req, res) => {
  productHelpers.getProductDetails(req.params.id)
    .then((product) => {
      res.render('admin/edit-product', { product })
    })
    .catch((err) => {
      console.log(err)
      res.redirect('/admin')
    })
})

router.post('/submit-update/:id', (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body)
    .then(() => {
      let newImage = req.files.image
      let imagePath = path.join(__dirname, '../public/images/products/', req.params.id + '.jpeg')
      newImage.mv(imagePath, (mvErr) => {
        if (!mvErr) {
          res.redirect('/admin')
        } else {
          console.log('Uploading image failed!')
          res.redirect('/admin')
        }
      })
    })
    .catch((err) => {
      console.log(err)
      res.redirect('/admin')
    })
})

router.get('/delete-product', (req, res) => {
  productHelpers.deleteProduct(req.query.id)
    .then((data) => {
      res.redirect('/admin')
    })
    .catch((err) => {
      console.log(err)
      res.redirect('/admin')
    })
})

module.exports = router;
