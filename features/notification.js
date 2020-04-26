const user = require('../services/users')
const midtransClient = require("midtrans-client");
const core = new midtransClient.CoreApi({
  isProduction : false,
  serverKey : process.env.SERVERKEY,
  clientKey : process.env.CLIENTKEY
});

const ref = id => ({
  user: { id: id },
  conversation: { id: id },
  channelId: 'telegram',
});

module.exports = function(controller) {

  controller.webserver.post('/notification_handler', async (req, res) => {
    const bot = await controller.spawn({});
    let receivedJson = req.body;
    core.transaction.notification(receivedJson)
      .then(async transactionStatusObject => {
        let orderId = transactionStatusObject.order_id;
        let transactionStatus = transactionStatusObject.transaction_status;
        let fraudStatus = transactionStatusObject.fraud_status;
        let order_id = orderId.split("-")[0];

        let summary = `Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}.<br>Raw notification object:<pre>${JSON.stringify(transactionStatusObject, null, 2)}</pre>`;

        // [5.B] Handle transaction status on your backend via notification alternatively
        // Sample transactionStatus handling logic
        if (transactionStatus == 'capture') {
          if (fraudStatus == 'challenge') {
            // TODO set transaction status on your databaase to 'challenge'
            await user.updateOrder(order_id, 'sending', async chat_id => { 
              await bot.changeContext(ref(chat_id));
              await bot.say(`Transaksi anda dalam status 'challenge'. Harap menunggu.`);           
            });
          } else if (fraudStatus == 'accept') {
            // TODO set transaction status on your databaase to 'success'
            await user.updateOrder(order_id, 'done', async chat_id => {
              await bot.changeContext(ref(chat_id));
              await bot.say(`Transaksi anda sukses. Terima kasih untuk berbelanja di shoppa`);           
            });
          }
        } else if (transactionStatus == 'settlement') {
          // TODO set transaction status on your databaase to 'success'
          // Note: Non-card transaction will become 'settlement' on payment success
          // Card transaction will also become 'settlement' D+1, which you can ignore
          // because most of the time 'capture' is enough to be considered as success
          await user.updateOrder(order_id, 'done', async chat_id => {
            await bot.changeContext(ref(chat_id));
            await bot.say(`Transaksi anda sukses. Terima kasih untuk berbelanja di shoppa`);           
          });
        } else if (transactionStatus == 'cancel' ||
          transactionStatus == 'deny' ||
          transactionStatus == 'expire') {
            // TODO set transaction status on your databaase to 'failure'
            await user.updateOrder(order_id, 'failure', async chat_id => {
              await bot.changeContext(ref(chat_id));
              await bot.say(`Maaf, transaksi anda gagal. Silahkan berbelanja kembali.`);         
            });
        } else if (transactionStatus == 'pending') {
          // TODO set transaction status on your databaase to 'pending' / waiting payment
          await user.updateOrder(order_id, 'sending', async chat_id => {
            await bot.changeContext(ref(chat_id));
            await bot.say(`Transaksi anda dalam status 'pending'. Harap menunggu.`);
          });
        } else if (transactionStatus == 'refund') {
          // TODO set transaction status on your databaase to 'refund'
          await user.updateOrder(order_id, 'failure', async chat_id => {
            await bot.changeContext(ref(chat_id));
            await bot.say(`Transaksi anda dalam status 'refund'. Silahkan berbelanja kembali.`);
          });
        }
        console.log(summary);
        res.send(summary);
      });
  });  
  
}