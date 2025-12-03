// models/AffiliateLink.ts
import { Schema, model, models, Document, Model } from 'mongoose'
import { IUser } from './User'

export type LinkStatus = 'aguardando' | 'ok' | 'erro'

export interface IAffiliateLink extends Document {
  user: IUser['_id']
  url: string
  source?: string
  status: LinkStatus
  lastScanAt: Date | null
  couponCount: number
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

const AffiliateLinkSchema = new Schema<IAffiliateLink>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['aguardando', 'ok', 'erro'],
      default: 'aguardando',
    },
    lastScanAt: {
      type: Date,
      default: null,
    },
    couponCount: {
      type: Number,
      default: 0,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

export const AffiliateLink: Model<IAffiliateLink> =
  models.AffiliateLink || model<IAffiliateLink>('AffiliateLink', AffiliateLinkSchema)
