const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.set('useCreateIndex', true); // gets rid of the ensureIndex deprecation warning triggered by unique fields 

const visitorSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true
    },
    url: {
      type: String,
      required: true
    },
    method: {
      type: String,
      required: true
    },
    ip: {
      type: String,
      required: true
    },
    device: {
      type: String,
      required: true,
      default: ''
    },
    browser: {
      type: String,
      required: true
    },
    os: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

var Visitors = mongoose.model("Visitor", visitorSchema);
module.exports = Visitors;