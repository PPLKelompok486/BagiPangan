import AdminDonationDeleteClient from "./client";

type PageProps = {
  params: Promise<{ donationId: string }>;
};

export default async function AdminDonationDeletePage({ params }: PageProps) {
  const { donationId } = await params;
  return <AdminDonationDeleteClient donationId={donationId} />;
}
