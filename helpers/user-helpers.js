var db = require("../config/connection");
var collection = require("../config/collection");
var bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
const { response } = require("express");
const { use } = require("../routes");
const { on } = require("nodemon");
const { ObjectId } = require("mongodb");
const Razorpay = require('razorpay');
const { resolve } = require("path");
var instance = new Razorpay({
  key_id: 'rzp_test_EIWgZj77vaDhMf',
  key_secret: 'RwrTRoRUlmSeMH4dBhuZl7Qc',
});
module.exports = {
  doSignup: (data) => {
    return new Promise(async (resolve, reject) => {
      data.Password = await bcrypt.hash(data.Password, 10);
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(data)
        .then((data) => {
          resolve(data);
        });
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Emailaddress: userData.Emailaddress });
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            // console.log('login success');
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            // console.log("login failed");
            resolve({ status: false });
          }
        });
      } else {
        // console.log('please check email address');
        resolve({ status: false });
      }
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: ObjectId(proId),
      quantity: 1,
    };
    proObj.quantity = parseInt(proObj.quantity);
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (user) {
        let proExists = user.products.findIndex(
          (product) => product.item == proId
        );
        if (proExists != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCartProduct: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.COLLECTION_PRODUCT,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          // {
          //     $lookup:{
          //         from:collection.COLLECTION_PRODUCT,
          //         let :{productList :'$products'},
          //         pipeline:[
          //             {
          //                 $match:{
          //                     $expr:{
          //                         $in:['$_id','$$productList']
          //                     }
          //                 }
          //             }
          //         ],as:'cartItems'
          //     }
          // }
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity: (details) => {
    count = parseInt(details.count);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
              "products.item": objectId(details.product),
            },
            {
              $inc: { "products.$.quantity": count },
            }
          )
          .then(() => {
            resolve({ removeProduct: false });
          });
      }
    });
  },
  removeCartProduct: (details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: objectId(details.cart) },
          {
            $pull: { products: { item: objectId(details.product) } },
          }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    });
  },
  totalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let totalPrice = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.COLLECTION_PRODUCT,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.Price"] } },
            },
          },
        ])
        .toArray();
      resolve(totalPrice[0].total);
      reject();
    });
  },
  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      console.log(order, products, total);
      let status = order.paymentMethod === "COD" ? "placed" : "pending";
      let dt = new Date()
      let time = {minutes : dt.getMinutes(), hour : dt.getHours(), second:dt.getSeconds() , date:dt.getDate(),year:dt.getFullYear(), month:dt.getMonth()}
      let orderObj = {
        deliveryDetails: {
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode,
        },
        userId: objectId(order.userId),
        paymentMethod: order.paymentMethod,
        products: products,
        totalAmount: total,
        status: status,
        date:{
          time:time.hour+":"+time.minutes+":"+time.second,
          date:time.date+"/"+time.month+"/"+time.year
        }
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: objectId(order.userId) });
          resolve(response.insertedId);
        });
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      resolve(cart.products);
    });
  },
  getOrderDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
      orderDetails = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .toArray();
      resolve(orderDetails);
    });
  },
  getOrderProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
      let orderItems = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate([
        {
          $match: { _id: objectId(orderId) },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: collection.COLLECTION_PRODUCT,
            localField: "item",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ["$product", 0] },
          },
        },

      ])
      .toArray()
    resolve(orderItems);
      
    })
  },generateRazorpay:(orderId,total)=>{
    return new Promise((resolve,reject)=>{
      instance.orders.create({
        amount: total*100,
        currency: "INR",
        receipt: orderId.toString()
    }, function (err, order) {
      console.log('new order',order)
        resolve(order);
    }
    )
    })
  },
  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto = require('crypto')
      let hmac = crypto.createHmac('sha256', 'RwrTRoRUlmSeMH4dBhuZl7Qc')

      hmac.update(details['payment[razorpay_order_id]'] +'|'+ details['payment[razorpay_payment_id]']);
      hmac = hmac.digest('hex')
      if(hmac == details['payment[razorpay_signature]']){
        resolve()
      }else{
        reject('error')
      }

    })
  },
  paymentStatusChange:(orderId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.ORDER_COLLECTION)
      .updateOne({_id:objectId(orderId)},
      {
        $set:{
          status:'placed'
        }
      }
      ).then(()=>{
        resolve()
      })
    })

  },doAdminLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let admin = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ Emailaddress: userData.Emailaddress });
      if (admin) {
        console.log("admin success")
        bcrypt.compare(userData.Password, admin.Password).then((status) => {
          if (status) {
            console.log('login success');
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            console.log('login Failed');
            resolve({ status: false });
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },
};
