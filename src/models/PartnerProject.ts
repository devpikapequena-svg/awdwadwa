// models/PartnerProject.ts
import mongoose, { Schema, Document, models, model } from 'mongoose'

export interface IPartnerProject extends Document {
  siteSlug: string           // ex: 'white'
  siteName: string           // nome bonitinho do site
  partnerName: string        // nome da pessoa/loja
  domain?: string
  buckpayStoreId?: string | null
  utmBase?: string | null

  ownerId: mongoose.Types.ObjectId
  ownerEmail: string
}

const PartnerProjectSchema = new Schema<IPartnerProject>(
  {
    siteSlug: { type: String, required: true, unique: true },
    siteName: { type: String, required: true },
    partnerName: { type: String, required: true },
    domain: { type: String, default: '' },
    buckpayStoreId: { type: String, default: null },
    utmBase: { type: String, default: null },

    // 🔽 DONO DO SITE
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerEmail: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

export default models.PartnerProject ||
  model<IPartnerProject>('PartnerProject', PartnerProjectSchema)
