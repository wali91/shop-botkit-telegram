//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

// This is the main file for the shop-botkit bot.

// Import Botkit's core features
const { Botkit } = require('botkit');
const { TelegramAdapter, TelegramEventTypeMiddleware } = require('botkit-adapter-telegram')

// Load process.env values from .env file
require('dotenv').config();


const adapter = new TelegramAdapter({
    access_token: process.env.TOKEN,
    webhook_url_host_name: process.env.HOST
});

adapter.use(new TelegramEventTypeMiddleware());

const controller = new Botkit({
    // webhook_uri: '/api/messages',
    adapter : adapter
});


// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {
    // load traditional developer-created local custom feature modules
    controller.loadModules(__dirname + '/features');
  });
  
  controller.webserver.get('/', (req, res) => {
    res.send(`This app is running Botkit ${ controller.version }.`);
  });