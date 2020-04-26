const keyboard = require('../services/keyboards');
const user = require('../services/users');
const midtransClient = require("midtrans-client");
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.SERVERKEY,
  clientKey: process.env.CLIENTKEY
});

const newUserReply = async (bot, msg) => {
	const name = msg.from.first_name;
  const identity = await bot.api.callAPI('getMe', 'GET', {});
  await bot.reply(msg, { 
    text: `Hai *${ msg.from.first_name }*, selamat datang di *shoppa*. ` +
    `Saya *${ identity.result.username }*, siap melayani permintaan anda.`,
    parseMode: "Markdown" 
  });
	await bot.reply(msg, { 
    text: "Untuk memudahkan transaksi, ijinkan saya" +
    " mencatat nama lengkap, alamat dan nomor telepon anda.",
    parseMode: "Markdown" 
  });
  await bot.reply(msg, { 
    text: `Kirimkan data anda melalui command */d* dengan format berikut:\n*NoTelepon*-` + 
    `*NamaLengkap*-*Alamat*\n\nContoh:\n*/d* *08123123123*-*John Doe*-*Bandung*`,
    parseMode: "Markdown" 
  });
};

module.exports = function(controller) {
    
  controller.hears(new RegExp(/\/start|\hi/), ['message'], async function(bot, message) {
    await user.checkUser(message.chat.id, async user => {
      if (user) {
        await bot.reply(message, { 
          text: `Hai *${ message.from.first_name }*, apa kabar? Silahkan browsing` +
          ` produk-produk kami dengan command */product*.`,
          replyKeyboard: {
            keyboard: [['/product', '/checkcart', '/checkout'], ['/me']],
            resize_keyboard: true
          },
          parseMode: "Markdown" 
        });
      }
      else {
        await newUserReply(bot, message)
      }
    });
    
  });
  
  controller.hears(new RegExp(/^\/d (.+)$/), ['message'], async function(bot, message) {
    try {
      const [phone, full_name, address] = message.matches[1].split("-");
      const name = message.from.first_name;

      await user.checkUser(message.chat.id, async cust => {
        try {
          if (cust) {
            await bot.reply(message, { 
              text: `*${name}*, anda sudah terdaftar dalam layanan kami. ` +
              `Silahkan langsung browsing produk-produk kami.`,
              parseMode: "Markdown" 
            });
          }
          else {
            await user.addUser(full_name, name, phone, message.chat.id, address);
            await bot.reply(message, { 
              text: `Selamat *${name}*, data anda telah tersimpan. Silahkan ` +
              `browsing produk-produk kami dengan menggunakan command */product*.`,
              replyKeyboard: {
                keyboard: [['/product', '/checkcart', '/checkout'], ['/me']],
                resize_keyboard: true
              },
              parseMode: "Markdown" 
            });
          }
        } catch(err) {
          console.log("Error1: ", err.message)
          if (err.response.data.message == 'Validation error') {
            await bot.reply(message, { 
              text: `*${name}*, nomor telepon yang anda masukkan sudah ` +
              `tersimpan dalam database kami. ` +
              `Mohon gunakan nomor telepon yang lain.`,
              parseMode: "Markdown" 
            });
          }
          else if (err.response.data.message.indexOf('notNull Violation') != -1) {
            await bot.reply(message, { 
              text: `*${name}*, ada kesalahan dalam format data yang anda ` +
              `masukkan. Mohon diulangi kembali.`,
              parseMode: "Markdown" 
            });
          }
        }
      })
    } catch(err) { console.log("Error2: ", err.message) }
  });
    
  controller.hears(new RegExp(/\/me/), ['message'], async function(bot, message) {
    // console.log('ref: ', message.reference);
    // const identity = await bot.api.callAPI('getMe', 'GET', {});
    // console.log('id: ', identity);
    // let asd = await bot.getConfig('activity');
    // console.log('asd: ', asd.channelData);
    await user.checkUser(message.chat.id, async user => {
      if (user) {
        await bot.reply(message, {
          text: `Nama: ${user.username}\nNama Lengkap: ${user.full_name}\n` +
          `Alamat: ${user.address}\nNo. Telepon: ${user.phone_number}`,
          parseMode: "Markdown"
        });
      }
      else {
        newUserReply(bot, message)
      }
    });
  });

  controller.hears(new RegExp(/\/product/), ['message'], async function(bot, message) {
    await user.getProducts(async data => {
      await bot.reply(message, {
        text: `*Nama*: ${data[0].name}\n*Harga*: Rp. ${data[0].price.toLocaleString('id-ID')}`, 
        replyKeyboard: {
          inline_keyboard: keyboard.inline_keyboard(1),
          resize_keyboard: true
        },
        parseMode: "Markdown"
      });
    })
  });
  
  controller.hears(new RegExp(/\/checkcart/), ['message'], async function(bot, message) {
    await user.checkUser(message.chat.id, async cust => {
      if (cust) {
        const res = await user.getOrder(message.chat.id);
        if (res.data.data.length) {
          const cart = res.data.data[0].order_detail;
          let total = 0;
          for (let i = 0; i < cart.length; i++) {
            total += cart[i].quantity * cart[i].Product.price
          }
          let text = '';
          cart.forEach(item =>{
            text += `*Name:* ${item.Product.name}\n` +
              `*Price:* Rp. ${item.Product.price.toLocaleString('id-ID')}` +
              `\n*Qtty:* ${item.quantity}\n`
          });
          text += `*TOTAL:* Rp. ${total.toLocaleString('id-ID')}`;
          await bot.reply(message, {
            text: text,
            parseMode: "Markdown"
          });
        }
        else {
          await bot.reply(message, {
            text: `Cart anda kosong, silahkan belanja.`,
            parseMode: "Markdown"
          });
        }   
      }
      else {
        newUserReply(bot, message)
      }
    });
  });
  
  controller.hears(new RegExp(/\/checkout/), ['message'], async function(bot, message) {
    await user.checkUser(message.chat.id, async cust => {
      if (cust) {
        const res = await user.getOrder(message.chat.id);
        if (res.data.data[0]) {
          const cart = res.data.data[0].order_detail;
          const orderId = res.data.data[0].id + '-' + `${Date.now()}`;
          let total = 0;
          for (let i = 0; i < cart.length; i++) {
            total += cart[i].quantity * cart[i].Product.price
          }
          const parameter = {
            transaction_details: {
              order_id: orderId,
              gross_amount: total
            },
            credit_card: {
              secure: true
            }
          };
          const transaction = await snap.createTransaction(parameter);
          await bot.reply(message, {
            text: transaction.redirect_url,
            parseMode: "Markdown"
          });
        }
        else {
          await bot.reply(message, {
            text: 'Tidak ada transaksi. Silahkan belanja.',
            parseMode: "Markdown"
          });
        } 
      }
      else {
        newUserReply(bot, message)
      }
    });
  });
  
}