'use client';



import { useCustomSidebar } from '@/contexts/SidebarContext.js';
import SecondaryNavigation from '@/components/SecondaryNavigation';

const ContentWrapper = ({ children }) => {
    const { isCollapsed } = useCustomSidebar();
    return (
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? '' : 'lg:ml-6'}`}>
            <SecondaryNavigation />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                {children}
            </main>
        </div>
    );
};

export default ContentWrapper;


