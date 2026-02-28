import { Schema, model, models } from "mongoose";

const participantSchema = new Schema(
  {
    accountId: { type: String, required: true },
    name: { type: String, required: true },
    avatarUrl: String,
    lastReadAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new Schema({
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderAvatarUrl: String,
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new Schema(
  {
    participants: { type: [participantSchema], required: true },
    listingId: String,
    listingTitle: String,
    lastMessage: {
      content: String,
      senderId: String,
      senderName: String,
      createdAt: Date,
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

conversationSchema.index({ "participants.accountId": 1 });

export const ConversationModel =
  models?.Conversation ?? model("Conversation", conversationSchema);
