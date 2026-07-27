import { redirect } from "next/navigation";

type LiveBoothRoomRedirectProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LiveBoothRoomRedirectPage({
  searchParams
}: LiveBoothRoomRedirectProps) {
  const params = await searchParams;
  const room = readParam(params.room) ?? "";
  const role = readParam(params.role) ?? "";
  const name = readParam(params.name) ?? "";
  const nextParams = new URLSearchParams();

  if (room) nextParams.set("room", room);
  if (role) nextParams.set("role", role);
  if (name) nextParams.set("name", name);

  redirect(`/live/room${nextParams.toString() ? `?${nextParams.toString()}` : ""}`);
}
