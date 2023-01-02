var db = require('../config/connection');
var collection = require("../config/collection");
const { response } = require('../app');
var objectId = require('mongodb').ObjectId
module.exports={
    addProduct:(product,callback)=>{
        console.log(product)
        product.Price = parseInt(product.Price);
        db.get().collection(collection.COLLECTION_PRODUCT)
        .insertOne(product).then((data)=>{
            // console.log(data);
            callback(data.insertedId);
            // callback(product._id);
        })
    },
    getAllProduct:()=>{
        return new Promise(async (resolve,reject)=>{
            let Products =await db.get().collection(collection.COLLECTION_PRODUCT)
            .find().toArray()
            resolve(Products);
            reject('sorry some error find'+reject)

        })
    },
    deleteProduct:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COLLECTION_PRODUCT)
            .deleteOne({_id:  objectId(productId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COLLECTION_PRODUCT)
            .findOne({_id: objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    editProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            proDetails.Price = parseInt(proDetails.Price);
            db.get().collection(collection.COLLECTION_PRODUCT)
            .updateOne({_id:objectId(proId)},{
                $set:{
                    Product:proDetails.Product,
                    Catagory:proDetails.Catagory,
                    Description:proDetails.Description,
                    Price:proDetails.Price
                }
            }).then((response)=>{
                resolve('product successfully updated')
            })
        })
    }
}