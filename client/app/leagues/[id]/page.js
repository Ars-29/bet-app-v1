import LeagueDetailPage from "@/components/league/LeagueDetailPage";

export default function LeagueDetail({ params }) {
  return <LeagueDetailPage leagueId={params.id} />;
}
