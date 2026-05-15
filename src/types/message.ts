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
  _count?: { replies: number };
};
