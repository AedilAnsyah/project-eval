import { getMembers, getMemberById } from "@/lib/db";
import LetterClient from "./LetterClient";

// Force static HTML pre-generation at build time
export const dynamic = "force-static";

// Enable Incremental Static Regeneration (re-generate page in background if DB changes)
export const revalidate = 10;

/**
 * Pre-defines dynamic route paths to compile them to static HTML during build
 */
export async function generateStaticParams() {
  try {
    const members = await getMembers();
    return members.map((member) => ({
      id: member.id,
    }));
  } catch (error) {
    console.error("Failed to generate static params during build:", error);
    return [];
  }
}

/**
 * Server Component Wrapper that pre-fetches member details and department
 * coordinator names, then serves the LetterClient with preloaded data.
 */
export default async function LetterDetailPage({ params }) {
  const resolvedParams = await params;
  const memberId = resolvedParams.id;

  let member = null;
  let koorName = "";

  try {
    member = await getMemberById(memberId);
    if (member) {
      // Fetch department members to identify the coordinator
      const deptMems = await getMembers(member.departemen);
      const koorMember = deptMems.find(m => m.role === 'koor');
      if (koorMember) {
        koorName = koorMember.nama;
      }
    }
  } catch (error) {
    console.error(`Error pre-fetching member #${memberId} on server:`, error);
  }

  return (
    <LetterClient 
      memberId={memberId} 
      initialMember={member} 
      initialKoorName={koorName} 
    />
  );
}
