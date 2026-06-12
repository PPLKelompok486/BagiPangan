import AdminDonationEditClient from "./client";

type PageProps = {
  params: Promise<{ donationId: string }>;
};

export default async function AdminDonationEditPage({ params }: PageProps) {
  const { donationId } = await params;
  return <AdminDonationEditClient donationId={donationId} />;
}
