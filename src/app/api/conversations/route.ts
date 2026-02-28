import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { ConversationModel } from "@/models/Conversation";
import type { Conversation, ConversationParticipant } from "@/lib/types";

interface ParticipantDoc {
  accountId: string;
  name: string;
  avatarUrl?: string;
  lastReadAt: Date;
}

interface MessageDoc {
  _id: { toString(): string };
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  createdAt: Date;
}

interface ConversationDoc {
  _id: { toString(): string };
  participants: ParticipantDoc[];
  listingId?: string;
  listingTitle?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: Date;
  };
  messages: MessageDoc[];
  createdAt: Date;
  updatedAt: Date;
  toObject?(): Record<string, unknown>;
}

function toConversation(doc: ConversationDoc, viewerAccountId: string): Conversation {
  const participant = doc.participants.find((p) => p.accountId === viewerAccountId);
  const lastReadAt = participant?.lastReadAt ?? new Date(0);

  const unreadCount = doc.messages.filter(
    (m) => m.senderId !== viewerAccountId && m.createdAt > lastReadAt
  ).length;

  return {
    id: doc._id.toString(),
    participants: doc.participants.map((p): ConversationParticipant => ({
      accountId: p.accountId,
      name: p.name,
      avatarUrl: p.avatarUrl,
      lastReadAt: p.lastReadAt.toISOString(),
    })),
    listingId: doc.listingId,
    listingTitle: doc.listingTitle,
    lastMessage: doc.lastMessage
      ? {
          content: doc.lastMessage.content,
          senderId: doc.lastMessage.senderId,
          senderName: doc.lastMessage.senderName,
          createdAt: doc.lastMessage.createdAt.toISOString(),
        }
      : undefined,
    unreadCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const accountId = `${session.user.id}_${session.user.role}`;

  try {
    const docs = await ConversationModel.find({
      "participants.accountId": accountId,
    })
      .sort({ updatedAt: -1 })
      .lean();

    const conversations = (docs as unknown as ConversationDoc[]).map((d) =>
      toConversation(d, accountId)
    );
    return NextResponse.json(conversations);
  } catch (e) {
    console.error("Conversations GET:", e);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const accountId = `${session.user.id}_${session.user.role}`;
  const userName = (session.user as { name?: string }).name ?? "User";
  const userAvatar = (session.user as { image?: string }).image;

  try {
    const body = await request.json();
    const { participantId, participantName, participantAvatarUrl, listingId, listingTitle } = body;

    if (!participantId || !participantName) {
      return NextResponse.json({ error: "participantId and participantName required" }, { status: 400 });
    }
    if (participantId === accountId) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    const query: Record<string, unknown> = {
      "participants.accountId": { $all: [accountId, participantId] },
    };
    if (listingId) query.listingId = listingId;

    const existing = await ConversationModel.findOne(query).lean();
    if (existing) {
      const conv = toConversation(existing as unknown as ConversationDoc, accountId);
      return NextResponse.json(conv);
    }

    const doc = await ConversationModel.create({
      participants: [
        { accountId, name: userName, avatarUrl: userAvatar ?? undefined },
        { accountId: participantId, name: participantName, avatarUrl: participantAvatarUrl ?? undefined },
      ],
      listingId: listingId ?? undefined,
      listingTitle: listingTitle ?? undefined,
      messages: [],
    });

    const conv = toConversation(doc as unknown as ConversationDoc, accountId);
    return NextResponse.json(conv);
  } catch (e) {
    console.error("Conversations POST:", e);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
