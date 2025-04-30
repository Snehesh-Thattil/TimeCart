var express = require('express');
var router = express.Router();
const productHelpers = require('../database/product-helpers')
const userHelpers = require('../database/user-helpers')

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

router.get('/signup', (req, res) => {
  res.render('user/signup')
})

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body)
    .then(() => {
      res.redirect('/')
    })
    .catch((err) => {
      console.log(err)
    })
})

router.get('/login', (req, res) => {
  res.render('user/login')
})

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body)
    .then(() => [
      res.redirect('/')
    ])
    .catch((err) => {
      console.log(err)
    })
})

module.exports = router;
