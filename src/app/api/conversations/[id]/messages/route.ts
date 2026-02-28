import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { ConversationModel } from "@/models/Conversation";
import mongoose from "mongoose";

export async function POST(
  request: Request,
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
  const senderName = (session.user as { name?: string }).name ?? "User";
  const senderAvatar = (session.user as { image?: string }).image;

  try {
    const body = await request.json();
    const content = (body.content ?? "").trim();
    if (!content) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

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

    const now = new Date();
    const message = {
      senderId: accountId,
      senderName,
      senderAvatarUrl: senderAvatar ?? undefined,
      content,
      createdAt: now,
    };

    doc.messages.push(message);
    doc.lastMessage = {
      content,
      senderId: accountId,
      senderName,
      createdAt: now,
    };

    // Update sender's lastReadAt so they don't see their own message as unread
    const pIdx = doc.participants.findIndex(
      (p: { accountId: string }) => p.accountId === accountId
    );
    if (pIdx !== -1) {
      doc.participants[pIdx].lastReadAt = now;
    }

    await doc.save();

    const saved = doc.messages[doc.messages.length - 1];
    return NextResponse.json({
      id: saved._id.toString(),
      senderId: saved.senderId,
      senderName: saved.senderName,
      senderAvatarUrl: saved.senderAvatarUrl,
      content: saved.content,
      createdAt: saved.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("Message POST:", e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
