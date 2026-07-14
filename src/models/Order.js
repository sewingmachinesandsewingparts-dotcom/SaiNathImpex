import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  image: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    placedAt: { type: String, required: true },
    status: {
      type: String,
      enum: ["placed", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
    total: { type: Number, required: true },
    itemsCount: { type: Number, required: true },
    items: [orderItemSchema],
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    shippingAddress: { type: String },
    paymentMethod: { type: String, default: "COD" },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
