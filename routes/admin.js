var express = require('express');
var router = express.Router();
const path = require('path')
var productHelpers = require('../database/product-helpers')

/* GET admins page. */
router.get('/', function (req, res, next) {
  let products = [
    { name: 'iPhone 17 pro', category: 'smartphone', price: 100000, brand: 'Apple', color: 'Silver', description: 'Apples lattest smartphone with all the features a user desires', imageURL: "https://www.apple.com/v/iphone-16-pro/f/images/overview/apple-intelligence/apple_intelligence_endframe__ksa4clua0duu_xlarge.jpg" },
    { name: 'Samsung S26 Ultra', category: 'smartphone', price: 75000, brand: 'Samsung', color: 'White', description: 'Samsungs new galaxy model packed with more camera features and better battery', imageURL: "https://cellmart.pk/wp-content/uploads/2025/01/sam-s25-ultra-silverblue-cellmart-350x350.jpg" },
    { name: 'Motorola M15 pro', category: 'smartphone', price: 50000, brand: 'Moto', color: 'Black', description: 'This new devices is loved by most users in the nevada', imageURL: "https://m.media-amazon.com/images/I/51-uBr44u1L._AC_UF1000,1000_QL80_.jpg" },
    { name: 'Lenovo r19 mini', category: 'smartphone', price: 35000, brand: 'Lenovo', color: 'Ocean Blue', description: 'More long lasting battery introduced by lenovo than ever before ', imageURL: "https://images.fonearena.com/blog/wp-content/uploads/2018/06/Lenovo-Z5.jpg" }
  ]

  res.render('admin/manage-products', { admin: true, products });
});

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
