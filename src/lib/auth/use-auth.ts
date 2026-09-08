import { useEffect, useState } from "react";
import type { AuthUser } from "@/types/auth";
import { getAuthUser, hasClientSession, subscribeAuth } from "./session";

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(() => getAuthUser());

  useEffect(() => {
    setUser(getAuthUser());
    return subscribeAuth(() => setUser(getAuthUser()));
  }, []);

  return user;
}

export function useHasSession() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(hasClientSession());
    return subscribeAuth(() => setAuthed(hasClientSession()));
  }, []);

  return authed;
}
