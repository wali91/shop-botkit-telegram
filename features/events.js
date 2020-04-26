const keyboard = require('../services/keyboards');
const user = require('../services/users');

module.exports = function(controller) {

  controller.on('telegram_callback_query', async(bot, message) => {
    const chat_id = message.callback_query.message.chat.id;
    const data = JSON.parse(message.callback_query.data);
    await user.getProducts(async items => {
      let i = items.findIndex(item => item.id == data.id);
      let desc = null;
      let text = (item, desc) => 
        desc ? `*Nama*: ${item.name}\n*Harga*: Rp. ${item.price.toLocaleString('id-ID')}\n*Detail*:\n${desc}` :
        `*Nama*: ${item.name}\n*Harga*: Rp. ${item.price.toLocaleString('id-ID')}`
      
      if (i != -1) {
        if (data.action == 'cart') {
          const res = await user.getOrder(chat_id);
          //console.log('data1: ', res.data.data[0])
          if (!res.data.data.length) {
            await user.createOrder(chat_id, data.id);
            await bot.api.callAPI('answerCallbackQuery', 'POST', {
              callback_query_id: message.callback_query.id,
              text: 'Product berhasil ditambahkan ke cart'});
          }
          else {
            let cart = res.data.data[0].order_detail;
            let i = cart.findIndex(item => item.Product.id == data.id);
            if (i != -1) {
              await user.updateOrderItem(cart[i].id, cart[i].quantity);
              await bot.api.callAPI('answerCallbackQuery', 'POST', {
                callback_query_id: message.callback_query.id,
                text: 'Product berhasil ditambahkan ke cart'});
            }
            else {
              await user.addOrderItem(res.data.data[0].id, data.id);
              await bot.api.callAPI('answerCallbackQuery', 'POST', {
                callback_query_id: message.callback_query.id,
                text: 'Product berhasil ditambahkan ke cart'});
            }
          }
        } 
        else {
          if (data.action == 'prev') {
            i = i == 0 ? items.length - 1 : i - 1;
          }
          else if (data.action == 'next') {
            i = i == items.length -1 ? 0 : i + 1;
          }
          else if (data.action == 'desc') {
            desc = items[i].description;
          }
          await bot.api.callAPI('editMessageText', 'POST', {
            text: text(items[i], desc), 
            chat_id: chat_id, 
            message_id: message.callback_query.message.message_id,
            reply_markup: {
              inline_keyboard: keyboard.inline_keyboard(items[i].id, desc),
              resize_keyboard: true
            },
            parse_mode: "Markdown"
          });
          await bot.api.callAPI('answerCallbackQuery', 'POST', {
            callback_query_id: message.callback_query.id,
            text: ''});
        }
      }
    });
  });

}