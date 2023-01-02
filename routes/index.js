const { response } = require("express");
var express = require("express");
var productHelper = require("../helpers/product-helper");
var userHelper = require("../helpers/user-helpers");
const { route } = require("./admin");
const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next();
  } else res.redirect("/login");
};

var router = express.Router();

/* GET home page. */
router.get("/", async function (req, res, next) {
  /* This is a conditional statement that checks if the user is logged in. If the user is not logged
  in, it will redirect them to the login page. */
  let user = req.session.user;
  let cartCount = null;
  if (user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  productHelper.getAllProduct().then((products) => {
    res.render("users/view-products", { products, user, cartCount });
  });
});
router.get("/signup", (req, res) => {
  res.render("users/signup", { user: req.session.user });
});
router.post("/signup", (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    res.redirect("/login");
  });
});
router.get("/login", (req, res) => {
  if (req.session.userLoggedIn) {
    res.redirect("/");
  } else {
    res.render("users/login", { loginError: req.session.loginError });
    req.session.loginError = false;
  }
});
router.post("/login", (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userLoggedIn = true;
      req.session.user = response.user;
      res.redirect("/");
    } 
    /* This is a conditional statement that checks if the user is logged in. If the user is not logged
    in, it will redirect them to the login page. */ else {
      req.session.loginError = "invalid username or password";
      res.redirect("/login");
    }
  });
});
router.get("/logout", verifyLogin,(req, res) => {
  req.session.user = null;
  req.session.userLoggedIn = null
  res.redirect("/");
});
router.get("/cart", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let cartItems = null;
  if (user) {
    cartItems = await userHelper.getCartCount(req.session.user._id);
  }
  let total = 0;
  let products = await userHelper.getCartProduct(req.session.user._id);
  if (products.length > 0) {
    total = await userHelper.totalAmount(req.session.user._id);
  }
  res.render("users/cart", {
    products,
    user: req.session.user,
    cartItems,
    total,
  });
});
router.get("/add-to-cart/:id", verifyLogin, (req, res) => {
  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
    // console.log(req.session.user);
  });
});
router.post("/change-product-quantity", verifyLogin, (req, res, next) => {
  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.totalAmount(req.body.user);
    res.json(response);
  });
});
router.post("/remove", verifyLogin, (req, res) => {
  userHelper.removeCartProduct(req.body).then((response) => {
    res.json(response);
  });
});
router.get("/place-order", verifyLogin, async (req, res) => {
  let total = await userHelper.totalAmount(req.session.user._id);
  res.render("users/place-order", { total, user: req.session.user });
});

router.post("/place-order", verifyLogin, async (req, res) => {
  let products = await userHelper.getCartProductList(req.body.userId);
  let totalPrice = await userHelper.totalAmount(req.body.userId);
  userHelper.placeOrder(req.body, products, totalPrice).then((orderId) => {
    // console.log(req.body)
    if (req.body["paymentMethod"] === "COD") {
      res.json({ codSuccess: true });
    } else {
      userHelper.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response);
      });
    }
  });
  // console.log(req.body)
});
router.get("/order-success", (req, res) => {
  res.render("users/order-success");
});
router.get("/orders", verifyLogin, async (req, res) => {
  let orderDetails = await userHelper.getOrderDetails(req.session.user._id);
  res.render("users/orders", { user: req.session.user, orderDetails });
});
router.get("/view-order-products/:id", verifyLogin, async (req, res) => {
  let orderItems = await userHelper.getOrderProducts(req.params.id);
  res.render("users/view-order-products", {
    orderItems,
    user: req.session.user.Username,
  });
});
router.get("/testing", verifyLogin, async (req, res) => {
  let orderDetails = await userHelper.getOrderDetails(req.session.user._id);
  res.send(orderDetails);
});
router.post("/verify-payment", (req, res) => {

  userHelper
    .verifyPayment(req.body)
    .then(() => {
      userHelper.paymentStatusChange(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log("if else checking error");
      res.json({ status: false });
    });
});
module.exports = router;
