var express = require('express');
const { route } = require('.');
const { rawListeners } = require('../app');
const productHelper = require('../helpers/product-helper');
var router = express.Router();
var productHelpers = require('../helpers/product-helper');
var userHelper = require("../helpers/user-helpers");
const verifyLogin =(req,res,next)=>{
  if (req.session.adminLoggedIn) {
    next();
  } else res.redirect("/admin/login");
}
router.get('/login',(req,res)=>{
  if (req.session.adminLoggedIn) {
    res.redirect("/admin");
  } else {
    res.render("admin/login", { loginError: req.session.loginError });
    req.session.loginError = false;
  }
})
router.post('/login',(req,res)=>{
  userHelper.doAdminLogin(req.body).then((response)=>{
    if(response.status){
      req.session.adminLoggedIn = true
      req.session.admin = response.admin
      res.redirect('/admin')
    }else{
      req.session.loginError = "Invalid username or password";
      res.redirect('/admin')
    }
  })
})
// ** Logout **//
router.get('/logout',(req,res)=>{
  req.session.admin = null;
  req.session.adminLoggedIn = null
  res.redirect('/admin')
})
/* GET users listing. */
router.get('/',verifyLogin,function(req, res, next) {
  productHelper.getAllProduct().then((products)=>{
    res.render('admin/view-products',{products,admin:true})
  })
});
router.get('/add-products',verifyLogin, function(req, res, next) {
  res.render('admin/add-products',{admin:true})
});
router.post('/add-products', function(req,res, next) {
  // console.log(req.body);
  // console.log(req.files.Image);

  productHelpers.addProduct(req.body,(data)=>{
    let imagehh = req.files.getImages;
    imagehh.mv('./public/product_images/'+data+'.jpg',(err,done)=>{
      if(!err){
        res.render('admin/add-products',{admin:true});
        console.log('Data successfully inserted');
      }
      else{
    console.log('data not inserted please check >'+err);
      }
    })
  })
});
router.get('/delete:id',(req,res)=>{
  var productId =req.params.id
      console.log(productId)
      productHelper.deleteProduct(productId).then((response)=>{
        res.redirect('/admin')
      })

  
  });
  router.get('/edit-product:id',async(req,res)=>{
    let product =await productHelper.getProduct(req.params.id)
      res.render('admin/edit-products',{product});
    })
  router.post('/edit-products:id',(req,res)=>{
    let imagehh = req.files.getImages;
    let data = req.params.id;
    productHelper.editProduct(req.params.id,req.body).then((msg)=>{
      console.log(msg);
      res.redirect('/admin')
      imagehh.mv('./public/product_images/'+data+'.jpg')
    })
  })

module.exports = router;
