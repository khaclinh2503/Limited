import type { Role, Quality } from "@prisma/client";

export type { Role, Quality };

export interface UserWithCount {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  ingameName: string | null;
  bio: string | null;
  gameId: string | null;
  zalo: string | null;
  role: Role;
  createdAt: Date;
  _count: { ownerships: number };
}

export interface FlowerTypeWithCount {
  id: string;
  name: string;
  quality: Quality;
  imageUrl: string | null;
  _count: { ownerships: number };
}

export interface LeaderboardEntry {
  id: string;
  ingameName: string | null;
  name: string | null;
  image: string | null;
  email: string;
  createdAt: Date;
  totalFlowers: number;
}

export interface PlayerDetail {
  id: string;
  ingameName: string | null;
  name: string | null;
  image: string | null;
  bio: string | null;
  gameId: string | null;
  zalo: string | null;
  totalFlowers: number;
  topFlowers: {
    id: string;
    name: string;
    quality: Quality;
    imageUrl: string | null;
  }[];
}
