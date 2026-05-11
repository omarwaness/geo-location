import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const zones = await prisma.zone.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(zones);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, coordinates } = body;

  if (!name || !coordinates || !Array.isArray(coordinates)) {
    return NextResponse.json(
      { error: "name and coordinates are required" },
      { status: 400 }
    );
  }

  const zone = await prisma.zone.create({
    data: { name, coordinates },
  });

  return NextResponse.json(zone, { status: 201 });
}
