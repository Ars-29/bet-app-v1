"use client";

import React from "react";
import { CalendarDays } from "lucide-react";
import { getTodaysUpcomingLeagues } from "@/data/dummayLeagues";
import MatchListPage from "@/components/shared/MatchListPage"; // Updated import path

const UpcomingMatchesPage = () => {
  const formatUpcomingTime = (startTime, match) => {
    if (!startTime) return "TBD";

    // Return only the time for today's matches (like "14:30")
    return startTime;
  };
  const upcomingConfig = {
    pageTitle: "Upcoming Matches",
    breadcrumbText: "Football | Upcoming Matches",
    fetchDataFunction: getTodaysUpcomingLeagues,
    matchTimeFormatter: formatUpcomingTime, // This will be called with match.startTime by MatchListPage
    PageIcon: CalendarDays,
    noMatchesConfig: {
      title: "No Upcoming Matches",
      message: "There are no upcoming matches scheduled for today.",
      buttonText: "View All Leagues",
      buttonLink: "/leagues",
      Icon: CalendarDays, // Icon for the no matches state
    },
    viewAllMatchesLink: "/matches",
  };

  return <MatchListPage config={upcomingConfig} />;
};

export default UpcomingMatchesPage;
