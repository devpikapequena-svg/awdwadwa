// models/User.ts
import { Schema, model, models, Document, Model } from 'mongoose'

export type Plan = 'none' | 'starter' | 'pro' | 'elite'

export interface IAffiliates {
  aliexpress: {
    appKey: string
    secret: string
    trackingId: string
  }
  amazon: {
    associateId: string   // Amazon Afiliado Id
    accessKey: string
    secretKey: string
  }
  awin: {
    affiliateId: string   // Awin Afiliado Id
    apiToken: string
  }
  shopee: {
    affiliateId: string   // Shopee ID Afiliado
    apiPassword: string   // Senha API
  }
  magalu: {
    storeName: string     // Nome da loja Magalu
  }
  natura: {
    digitalSpaceUrl: string // Link do Espaço Digital Natura
  }
}

export interface IUser extends Document {
  name: string
  email: string
  password: string
  plan: Plan
  affiliates: IAffiliates
  createdAt: Date
  updatedAt: Date
}

const AffiliatesSchema = new Schema<IAffiliates>(
  {
    aliexpress: {
      appKey: { type: String, default: '' },
      secret: { type: String, default: '' },
      trackingId: { type: String, default: '' },
    },
    amazon: {
      associateId: { type: String, default: '' },
      accessKey: { type: String, default: '' },
      secretKey: { type: String, default: '' },
    },
    awin: {
      affiliateId: { type: String, default: '' },
      apiToken: { type: String, default: '' },
    },
    shopee: {
      affiliateId: { type: String, default: '' },
      apiPassword: { type: String, default: '' },
    },
    magalu: {
      storeName: { type: String, default: '' },
    },
    natura: {
      digitalSpaceUrl: { type: String, default: '' },
    },
  },
  { _id: false }
)

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    plan: {
      type: String,
      enum: ['none', 'starter', 'pro', 'elite'],
      default: 'none',
    },
    affiliates: {
      type: AffiliatesSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
)

export const User: Model<IUser> =
  models.User || model<IUser>('User', UserSchema)
