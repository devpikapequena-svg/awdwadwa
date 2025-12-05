// src/models/AdSpend.ts
import mongoose, { Schema, Document, models, model } from 'mongoose'

export interface IAdSpend extends Document {
  userId: string
  siteSlug: string
  siteName: string
  refDate: string // Dia de referência no formato 'YYYY-MM-DD' (data de Brasília)
  amount: number
  notes?: string | null
}

const AdSpendSchema = new Schema<IAdSpend>(
  {
    userId: { type: String, required: true, index: true },
    siteSlug: { type: String, required: true },
    siteName: { type: String, required: true },
    refDate: { type: String, required: true, index: true }, // ex.: '2025-12-05'
    amount: { type: Number, required: true },
    notes: { type: String, default: null },
  },
  { timestamps: true },
)

AdSpendSchema.index({ userId: 1, refDate: 1, siteSlug: 1 })

export default models.AdSpend || model<IAdSpend>('AdSpend', AdSpendSchema)
