const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dishSchema = new Schema(
    {
      _id: { type: Schema.ObjectId, auto: true },
      name: {
        type: String,
        required: true,
        unique: true
      },
      description: {
        type: String,
        required: true
      },
      category: {
        type: String,
        required: true
      },
      price: {
        type: String, // to be changed to currency
        required: true,
        min: 0
      },
      zindex: {
        type: Number,
        required: true
      },
      image: {
        type: String,
        required: false
      }
    },
    {
      timestamps: true
    }
  );

var Dishes = mongoose.model("Dish", dishSchema);
module.exports = Dishes;