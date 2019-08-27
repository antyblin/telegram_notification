/**
 * @module telegram_notification/telegram
 */

var WEBHOOK_URL = "https://api.telegram.org/bot";
var http = require('@jetbrains/youtrack-scripting-api/http');

/**
 * @typedef {Object} Telegram
 *
 * @classdesc Main class that is used to connect workflow to telegram.
 *
 * @property {string} [botToken] Telegram BOT-Token
 *
 * @example
 * var telegramClient = new telegram.Telegram('MyBotToken');
 * telegramClient.send(123456789, 'Test text');
 */

/**
 * Creates an object that lets you send notify to telegram
 * @param {string} [botToken] Telegram BOT-Token
 * @constructor Telegram
 *
 * @see sendMessage
 */
var Telegram = function(botToken) {
  this.botToken = botToken;
  this.connection = this._getConnection();
};


Telegram.prototype._getConnection = function(botToken) {
  var connection = new http.Connection(WEBHOOK_URL + this.botToken || botToken, null, 2000);
  connection.addHeader("Content-Type", "application/json");
  return connection;
};

/**
 * Send request to Telegram
 * @param {string} [method] Method name (see Telegram Bot API)
 * @param {object} [queryParams] Query params
 * @param {object|array|string} [payload] Payload
 */
Telegram.prototype._sendRequest = function(method, queryParams, payload) {
  var response = this.connection.postSync('/' + method, queryParams || [], payload || '');
  if (!response.isSuccess) {
    console.warn('Failed to post notification to Telegram. Details: ' + response.toString());
  }
  return response;
};

Telegram.prototype.getUpdates = function() {
  return this._sendRequest("getUpdates");
};

/**
 * Send message to Telegram
 * @param {int|string} [chatId] - Reciever ID in Telegram
 * @param {string} [text] Text to send.
 * @returns {boolean} If sended - return true, else - return false
 */
Telegram.prototype.sendMessage = function(chatId, text) {
  var payload = {
    "chat_id": chatId,
    "text": text,
    "parse_mode": "Markdown",
  };
  var connection = new http.Connection(WEBHOOK_URL + this.botToken + "/sendMessage", null, 2000);
  connection.addHeader("Content-Type", "application/json");
  var response = connection.postSync("", [], JSON.stringify(payload));
  if (!response.isSuccess) {
    console.warn('Failed to post notification to Telegram. Details: ' + response.toString());
  }
  return this;
};

/**
 * Get list of users who installed bot with chat ids (I hope so)
 */
Telegram.prototype.getUsersChats = function () {
    var response = this._sendRequest('getUpdates');
    var result = false;
    var receivers = {};

    try {
        result = JSON.parse(response.response);
    } catch (e) {
        console.warn(e);
        return false;
    }
    if (result.ok) {
        for (var i in result.result) {
            if (result.result.hasOwnProperty(i)) {
                var entry = result.result[i];
                if (entry.message && entry.message.chat && entry.message.chat.id && entry.message.from && entry.message.from.username) {
                    receivers[entry.message.from.username] = entry.message.chat.id;
                }
            }
        }
    }
    return receivers;
};

exports.Telegram = Telegram;
