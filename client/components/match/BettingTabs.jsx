import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../ui/button"
import { useBetting } from "@/hooks/useBetting"


const BettingTabs = ({ matchData }) => {
    const [selectedTab, setSelectedTab] = useState("all")
    const scrollAreaRef = useRef(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    // Use the backend-provided betting data directly
    const bettingData = matchData?.betting_data || [];
    const categories = matchData?.odds_classification?.categories || [{ id: 'all', label: 'All', odds_count: 0 }];
    const hasData = bettingData.length > 0;

    // Helper function to get data by category
    const getDataByCategory = useCallback((categoryId) => {
        if (categoryId === 'all') {
            return bettingData;
        }
        return bettingData.filter(item => item.category === categoryId);
    }, [bettingData]);

    const tabs = useMemo(() => [
        { id: "all", label: "All" },
        ...categories.filter(cat => cat.id !== "all").map(cat => ({
            id: cat.id,
            label: cat.label
        }))
    ], [categories])    // Check scroll state
    const checkScrollState = useCallback(() => {
        const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollElement) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollElement
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
        }
    }, [])

    //INFO: Scroll functions
    const scrollLeft = () => {
        const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollElement) {
            scrollElement.scrollBy({ left: -200, behavior: 'smooth' })
        }
    }

    const scrollRight = () => {
        const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollElement) {
            scrollElement.scrollBy({ left: 200, behavior: 'smooth' })
        }
    }
    // Listen for scroll events
    useEffect(() => {
        const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollElement) {
            scrollElement.addEventListener('scroll', checkScrollState)
            // Initial check with delay to ensure layout is ready
            const timer = setTimeout(checkScrollState, 100)

            return () => {
                scrollElement.removeEventListener('scroll', checkScrollState)
                clearTimeout(timer)
            }
        }
    }, [checkScrollState])    // Check scroll state on resize and when component mounts
    useEffect(() => {
        const handleResize = () => {
            setTimeout(checkScrollState, 100)
        }
        window.addEventListener('resize', handleResize)
        // Also check when component mounts or updates
        setTimeout(checkScrollState, 200)

        return () => window.removeEventListener('resize', handleResize)
    }, [checkScrollState])

    // Memoized filtered data for individual tabs
    const getTabData = useCallback((tab) => {
        return getDataByCategory(tab.id);
    }, [getDataByCategory]); return (
        <div className="mb-6  -mt-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full ">                {/* Tab navigation with scroll buttons */}
                <div className="mb-4 sm:mb-6 bg-white pb-2 pl-2 sm:pl-[13px] p-1">
                    <div className="relative flex items-center">
                        {/* Left scroll button - Always visible */}

                        {
                            canScrollLeft && (
                                <button
                                    onClick={scrollLeft}
                                    className={`absolute left-0 z-10 flex hover:bg-gray-100 items-center justify-center w-8 h-8 bg-white transition-all duration-200  text-black cursor-pointer`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            )
                        }

                        {/* Scrollable tabs area */}
                        <div className="overflow-hidden w-fit mx-8">
                            <ScrollArea
                                ref={scrollAreaRef}
                                orientation="horizontal"
                                className="w-full"
                            >
                                <div className="flex gap-1 sm:gap-1.5 min-w-max pr-4">
                                    {tabs.map((tab) => (
                                        <Button
                                            key={tab.id}
                                            onClick={() => setSelectedTab(tab.id)}
                                            className={`px-2 py-1.5 sm:px-3 sm:py-1 font-normal cursor-pointer text-xs rounded-2xl sm:rounded-3xl whitespace-nowrap transition-all duration-200 flex-shrink-0 ${selectedTab === tab.id
                                                ? "bg-base text-white "
                                                : "text-gray-600 hover:text-gray-900 bg-white  hover:bg-gray-100"
                                                }`}
                                        >
                                            {tab.label}
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Right scroll button - Always visible */}
                        {
                            canScrollRight && (
                                <button
                                    onClick={scrollRight}
                                    className={`absolute right-0 z-10 flex items-center justify-center w-8 h-8 bg-white  transition-all duration-200 hover:bg-gray-100 text-black cursor-pointer`}
                                    disabled={!canScrollRight}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            )
                        }

                    </div>
                </div>
                <TabsContent value="all" className="space-y-3">
                    <BettingAccordionGroupAll bettingData={bettingData} tabs={tabs} />
                </TabsContent>                {/* Other tab contents - Optimized with memoized data */}
                {tabs.slice(1).map((tab) => (
                    <TabsContent key={tab.id} value={tab.id} className="space-y-3">
                        <BettingAccordionGroup
                            bettingData={getTabData(tab)}
                            emptyMessage={`${tab.label} betting options will be displayed here`}
                        />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}




const BettingAccordionGroupAll = ({ bettingData, tabs }) => {
    // Create category groups from backend data
    const categoryGroups = useMemo(() => {
        if (!bettingData || bettingData.length === 0) return [];

        // Group betting data by category
        const groupedByCategory = {};

        bettingData.forEach(item => {
            const categoryId = item.category;
            if (!groupedByCategory[categoryId]) {
                groupedByCategory[categoryId] = [];
            }
            groupedByCategory[categoryId].push(item);
        });

        // Map to the format expected by the component
        return tabs
            .filter(tab => tab.id !== "all")
            .map(tab => ({
                id: tab.id,
                label: tab.label,
                markets: groupedByCategory[tab.id] || [],
                totalMarkets: (groupedByCategory[tab.id] || []).length
            }))
            .filter(group => group.markets.length > 0);
    }, [bettingData, tabs]);

    return (
        <div className="space-y-2">
            <Accordion type="multiple" className="space-y-2">
                {categoryGroups.map((category) => (
                    <OptimizedAccordionItem
                        key={category.id}
                        category={category}
                    />
                ))}
            </Accordion>
        </div>
    );
};

// Separate optimized accordion item component to prevent unnecessary re-renders
const OptimizedAccordionItem = ({ category }) => {
    return (
        <AccordionItem
            value={category.id}
            className="bg-white border border-gray-200  overflow-hidden  duration-200"
        >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50/50 transition-colors duration-200 [&[data-state=open]]:bg-gray-50/80">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <h4 className="text-sm font-semibold text-gray-900">{category.label}</h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {category.totalMarkets} markets
                        </span>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 bg-gray-50/30">
                <div className="space-y-3">
                    {category.markets.map((section) => (
                        <OptimizedMarketSection key={section.id} section={section} />
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

// Optimized market section component
const OptimizedMarketSection = ({ section }) => {
    return (
        <div className="bg-white  border border-gray-100 overflow-hidden">
            <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h5 className="text-xs font-medium text-gray-700">{section.title}</h5>
            </div>            <div className="p-2">
                <BettingOptionsTable options={section.options} section={section} />
            </div>
        </div>
    );
};

// Modern Betting Markets Component - Inspired by professional betting interfaces
const BettingAccordionGroup = ({ bettingData, emptyMessage }) => {
    if (!bettingData || bettingData.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <div className="text-lg font-medium mb-2">No betting options available</div>
                <div className="text-sm">{emptyMessage || "Betting options will be displayed here"}</div>
            </div>
        )
    }

    return (
        <div className="space-y-3 bg-white h-full p-3">
            {bettingData.map((section) => (
                <BettingMarketCard key={section.id} section={section} />
            ))}
        </div>
    )
}

// Individual Market Card Component - Compact and Professional Design
const BettingMarketCard = ({ section }) => {
    return (
        <div className="bg-white border  overflow-hidden  transition-all duration-200">
            {/* Market Header */}
            <div className=" px-4 py-2.5 ">
                <h3 className="text-sm font-semibold text-gray-800">{section.title}</h3>
            </div>            {/* Betting Options - Table-like Layout */}
            <div className="p-3">
                <BettingOptionsTable options={section.options} section={section} />
            </div>
        </div>
    )
}

// Optimized betting options table with memoization
const BettingOptionsTable = ({ options, section }) => {
    // Memoize the grid layout calculation
    const { gridClass, isThreeWay } = useMemo(() => {
        const isThreeWayMarket = options.length === 3 &&
            (options.some(opt => opt.label.toLowerCase() === 'draw') ||
                options.every(opt => ['1x', 'x2', '12'].includes(opt.label.toLowerCase())));

        if (isThreeWayMarket) {
            return { gridClass: "grid-cols-3", isThreeWay: true };
        }

        // Optimized grid calculation
        const optionsCount = options.length;
        let gridClass;
        if (optionsCount <= 2) gridClass = "grid-cols-2";
        else if (optionsCount <= 4) gridClass = "grid-cols-2 sm:grid-cols-4";
        else if (optionsCount <= 6) gridClass = "grid-cols-2 sm:grid-cols-3";
        else gridClass = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

        return { gridClass, isThreeWay: false };
    }, [options]);

    return (<div className={`grid ${gridClass} gap-1`}>
        {options.map((option, index) => (
            <BettingOptionCompact
                key={`${option.label}-${index}`}
                label={option.label}
                odds={option.odds}
                section={section}
            />
        ))}
    </div>
    );
};

// Compact Betting Option - Professional and Sleek
const BettingOptionCompact = ({ label, odds, section }) => {
    const { createBetHandler } = useBetting();

    // Create a mock match object for the betting system
    const mockMatch = {
        id: section?.id || 'betting-option',
        team1: section?.title || 'Selection',
        team2: '',
        competition: 'Betting Market',
        time: 'Live'
    };

    return (
        <Button
            className="group relative px-2 py-1 text-center transition-all duration-200 active:scale-[0.98] betting-button"
            onClick={createBetHandler(mockMatch, label, odds, section?.type || 'market')}
        >
            {/* Content */}
            <div className="relative w-full flex justify-between py-1 z-10">
                <div className="text-[12px] text-white font-medium mb-0.5 transition-colors duration-200 leading-tight">
                    {label}
                </div>
                <div className="text-[12px] font-bold text-white transition-colors duration-200">
                    {odds}
                </div>
            </div>
        </Button>
    )
}

export default BettingTabs
