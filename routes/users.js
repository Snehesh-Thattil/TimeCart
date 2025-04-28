var express = require('express');
var router = express.Router();
const productHelpers = require('../database/product-helpers')

/* GET home page. */
router.get('/', function (req, res, next) {
  productHelpers.getProducts()
    .then((products) => {
      res.render('user/view-products', { products, admin: false })
    })
    .catch((err) => {
      console.log('Error getting products :', err)
    })
})

module.exports = router;
