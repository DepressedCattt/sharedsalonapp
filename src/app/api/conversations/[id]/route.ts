import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { ConversationModel } from "@/models/Conversation";
import mongoose from "mongoose";
import type {
  ConversationWithMessages,
  ConversationParticipant,
  Message,
} from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  const accountId = `${session.user.id}_${session.user.role}`;

  try {
    const doc = await ConversationModel.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = doc.participants.some(
      (p: { accountId: string }) => p.accountId === accountId
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark as read for this user
    const pIdx = doc.participants.findIndex(
      (p: { accountId: string }) => p.accountId === accountId
    );
    if (pIdx !== -1) {
      doc.participants[pIdx].lastReadAt = new Date();
      await doc.save();
    }

    const result: ConversationWithMessages = {
      id: doc._id.toString(),
      participants: doc.participants.map(
        (p: { accountId: string; name: string; avatarUrl?: string; lastReadAt: Date }): ConversationParticipant => ({
          accountId: p.accountId,
          name: p.name,
          avatarUrl: p.avatarUrl,
          lastReadAt: p.lastReadAt.toISOString(),
        })
      ),
      listingId: doc.listingId,
      listingTitle: doc.listingTitle,
      lastMessage: doc.lastMessage?.content
        ? {
            content: doc.lastMessage.content,
            senderId: doc.lastMessage.senderId,
            senderName: doc.lastMessage.senderName,
            createdAt: doc.lastMessage.createdAt.toISOString(),
          }
        : undefined,
      unreadCount: 0,
      messages: doc.messages.map(
        (m: { _id: { toString(): string }; senderId: string; senderName: string; senderAvatarUrl?: string; content: string; createdAt: Date }): Message => ({
          id: m._id.toString(),
          senderId: m.senderId,
          senderName: m.senderName,
          senderAvatarUrl: m.senderAvatarUrl,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })
      ),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };

    return NextResponse.json(result);
  } catch (e) {
    console.error("Conversation GET:", e);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}
