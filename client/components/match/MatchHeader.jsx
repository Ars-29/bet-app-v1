"use client"
import { useRef, useState } from "react"
import { ChevronLeft, ChevronDown, Clock } from "lucide-react"
import MatchDropdown from "./MatchDropdown"
import { allMatches } from "@/data/dummyMatches"
import { useRouter } from "next/navigation"
const MatchHeader = ({ matchId }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const triggetRef = useRef(null)
    const currentMatch = allMatches.find(match => match.id === matchId)
    const match = currentMatch || allMatches[0]
    const router = useRouter()
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen)
    }

    const closeDropdown = () => {
        setIsDropdownOpen(false)
    }

    return (
        <div className="mb-4 bg-white p-3">
            {/* Breadcrumb */}
            <button
                onClick={() => { router.back() }}
                className="flex cursor-pointer items-center text-xs text-slate-500 mb-3 hover:text-slate-600 transition-all" >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1 truncate">Football | {match.competition}</span>
            </button>

            {/* Match Header */}
            <div className="relative">
                <div className="p-4 pl-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div
                            className="flex items-center cursor-pointer hover:bg-gray-50 py-2 px-3 rounded-2xl transition-colors"
                            onClick={toggleDropdown}
                            ref={triggetRef}
                        >
                            <div className="flex items-center space-x-3">
                                <TeamBadge
                                    country={match.homeTeam.shortName}
                                    color={match.homeTeam.jerseyColor}
                                />
                                <span className="text-base font-medium">{match.homeTeam.name}</span>
                                <span className=" text-slate-400">vs</span>
                                <span className="text-base font-medium">{match.awayTeam.name}</span>
                                <TeamBadge
                                    country={match.awayTeam.shortName}
                                    color={match.awayTeam.jerseyColor}
                                />
                            </div>
                            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="flex items-center text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            <span className="whitespace-nowrap">{match.date} {match.time}</span>
                        </div>
                    </div>
                </div>                <MatchDropdown
                    matches={allMatches}
                    isOpen={isDropdownOpen}
                    onClose={closeDropdown}
                    triggerRef={triggetRef}
                    currentMatchId={matchId}
                />
            </div>
        </div>
    )
}

const TeamBadge = ({ country, color }) => {
    return (
        <div className={`w-6 h-6 ${color} rounded-full flex items-center justify-center shadow-sm`}>
            <span className="text-white text-[8px] font-medium">{country}</span>
        </div>
    )
}

export default MatchHeader