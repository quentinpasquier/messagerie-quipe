export type ReactionDTO = {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
  user: { id: string; name: string };
};

export type UserDTO = {
  id: string;
  name: string;
  image: string | null;
  status: string;
};

export type LinkPreviewDTO = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

export type MessageDTO = {
  id: string;
  content: string;
  imageUrl: string | null;
  userId: string;
  channelId: string;
  parentId: string | null;
  createdAt: string;
  user: UserDTO;
  reactions: ReactionDTO[];
  linkPreviews?: LinkPreviewDTO[];
  _count?: { replies: number };
};
