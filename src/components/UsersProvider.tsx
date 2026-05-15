"use client";

import { createContext, useContext } from "react";

export type SimpleUser = {
  id: string;
  name: string;
  image: string | null;
};

const UsersContext = createContext<SimpleUser[]>([]);

export function UsersProvider({
  users,
  children,
}: {
  users: SimpleUser[];
  children: React.ReactNode;
}) {
  return (
    <UsersContext.Provider value={users}>{children}</UsersContext.Provider>
  );
}

export function useUsers(): SimpleUser[] {
  return useContext(UsersContext);
}
