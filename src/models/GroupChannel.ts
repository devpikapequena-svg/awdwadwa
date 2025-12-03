// models/GroupChannel.ts
import { Schema, model, models, Document, Model } from 'mongoose'
import { IUser } from './User'
import { IFireQueue } from './FireQueue' // ADD

export type Platform = 'telegram' | 'whatsapp' | 'discord'
export type ConnStatus = 'conectado' | 'erro' | 'pendente'

export interface IGroupChannel extends Document {
  user: IUser['_id']
  name: string
  platform: Platform
  typeLabel: string
  members: number
  linkedQueues: string
  status: ConnStatus
  lastActivity: string
  enabled: boolean
  queueIds: IFireQueue['_id'][]       // 🔥 ADD
  createdAt: Date
  updatedAt: Date
}

const GroupChannelSchema = new Schema<IGroupChannel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ['telegram', 'whatsapp', 'discord'],
      required: true,
    },
    typeLabel: {
      type: String,
      default: 'Grupo',
    },
    members: {
      type: Number,
      default: 0,
    },
    linkedQueues: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['conectado', 'erro', 'pendente'],
      default: 'pendente',
    },
    lastActivity: {
      type: String,
      default: 'Nenhuma atividade registrada',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    // 🔥 FILAS LIGADAS NESSE GRUPO
    queueIds: {
      type: [Schema.Types.ObjectId],
      ref: 'FireQueue',
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

export const GroupChannel: Model<IGroupChannel> =
  models.GroupChannel || model<IGroupChannel>('GroupChannel', GroupChannelSchema)
