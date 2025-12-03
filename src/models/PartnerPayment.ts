import mongoose from 'mongoose'

const PartnerPaymentSchema = new mongoose.Schema(
  {
    partnerId: { type: String, required: true },
    amount: { type: Number, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.models.PartnerPayment ||
  mongoose.model('PartnerPayment', PartnerPaymentSchema)
