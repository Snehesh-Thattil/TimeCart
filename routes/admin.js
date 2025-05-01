var express = require('express');
var router = express.Router();
const path = require('path')
var productHelpers = require('../database/product-helpers')

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

router.post('/add-product', (req, res) => {
  if (!req.files || !req.files.image) {
    return res.render('admin/add-product', { admin: true, error: 'Product image is required' })
  }

  productHelpers.addProduct(req.body, (err, insertedId) => {
    if (err) {
      console.log('Error adding product to database:', err)
      return res.render('admin/add-product', { admin: true, error: 'Failed to add product' })
    }

    let image = req.files.image
    let imagePath = path.join(__dirname, '../public/images/products/', insertedId + '.jpeg')

    image.mv(imagePath, (mvErr) => {
      if (!mvErr) {
        res.render('index', { admin: true })
        console.log('Successfully Added product image and details')
      } else {
        console.log('Error moving product image', mvErr)
        return res.render('index', { admin: true, error: 'Product added but image upload failed' })
      }
    })

  })
})

module.exports = router;
