require('dotenv').config()

const axios = require("axios");
const API_URL = process.env.API_URL;
const Customer = 'api/customer/';
const Product = 'api/product/';
const Order = 'api/order/';
const OrderItem = 'api/orderitem/';

exports.addUser = (full_name, name, phone, id, email, cb) =>
  axios.post(API_URL + Customer, {
    data: {
      attributes: {
        id: id,
        full_name: full_name,
        phone_number: phone,
        username: name,
        email : email
      }
    }
  })
    //.then(() => cb())
    //.catch(err => {
    //  cb(err.response.data.message);
    //  console.log('Error1 addUser: ', err.response.data.message)
    //})
    //.catch(err => {
    //  console.log('Error2 addUser: ', err.message)
    //})

exports.checkUser = (id, cb) =>
  axios.get(API_URL + Customer + id)
    .then(res => cb(res.data.data))
    .catch(err => console.log(err.message));

exports.getOrder = (id) => {
  return axios.get(API_URL + Customer + id + '/order');
}

exports.getOrderById = (id) => {
  return axios.get(API_URL + Order + id);
}

exports.getProducts = (cb) =>
  axios.get(API_URL + Product)
		.then(res => cb(res.data.data))
		.catch(err => console.log(err.message))

exports.getProduct = (id, cb) => 
  axios.get(API_URL + Product + id)
		.then(res => cb(res.data.data))
		.catch(err => console.log(err.message))


exports.createOrder = (chat_id, product_id) => {
  const data = {
    data: {
      attributes: {
        user_id: chat_id,
        status: 'accepted',
        order_detail: [
          {
            product_id: product_id,
            quantity: 1
          }
        ]
      }
    }
  };
  return axios.post(API_URL + Order, data);
}

exports.addOrderItem = (id, product_id) => {
  const data = {
    data: {
      attributes: {
        product_id: product_id,
        quantity: 1
      }
    }
  };
  return axios.post(API_URL + Order + id, data);
}

exports.updateOrderItem = (id, quantity) => {
  const data = {
    data: {
      attributes: {
        quantity: quantity + 1
      }
    }
  };
  return axios.put(API_URL + OrderItem + id, data);
}

exports.updateOrder = (id, status, cb) => 
  axios.put(API_URL + Order + id, {
    data: {
      attributes: {
        status: status,
      }
    }
  })
    .then(() => exports.getOrderById(id))
    .then(order => cb(order.data.data.user_id))
    .catch(err => console.log(err.message))