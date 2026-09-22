import EditorClient from "@/components/editor/EditorClient";

export const dynamic = "force-dynamic";

export default async function TasarimPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const designId = id && Number.isFinite(Number(id)) ? Number(id) : undefined;
  return <EditorClient designId={designId} />;
}
