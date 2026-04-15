"use server";

import { getPlayerDetail } from "@/lib/queries";

export async function getPlayerDetailAction(userId: string) {
  return getPlayerDetail(userId);
}
