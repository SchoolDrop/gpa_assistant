import { Schema, model } from "mongoose";

const historySchema = new Schema({
  user_id: String,
  data_use: String,
  created_at: {
    type: Date,
    default: new Date(),
  },
});
const historyCalculationSchema = new Schema({
  user_id: String,
  calc: Number,
  data: String,
  data_use: String,
  created_at: {
    type: Date,
    default: new Date(),
  },
});

const saveSchema = new Schema({
  user_id: String,
  data_use: String,
  data_name: String,
  data: Number,
  created_at: {
    type: Date,
    default: new Date(),
  },
});

export const dataSaved = model("dataSaved", saveSchema);
export const histories = model("histories", historySchema);
export const historiesCalc = model(
  "historyCalculations",
  historyCalculationSchema,
);
