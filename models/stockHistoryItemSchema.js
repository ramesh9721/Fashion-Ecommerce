const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stockHistoryItemSchema = new Schema({
  quantity: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

module.exports = stockHistoryItemSchema;
