import PropertyDetailsClient from "./PropertyDetailsClient";

export const instant = false;

export default async function PropertyDetailsPage({
params,
}: {
params: Promise<{ id: string }>;
}) {
const { id } = await params;

return <PropertyDetailsClient id={id} />;
}