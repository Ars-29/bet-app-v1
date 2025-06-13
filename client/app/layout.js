import { Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/components/ReduxProvider";
import { SidebarProvider } from "@/contexts/SidebarContext.js";
import Header from "@/components/Header";
import SidebarWrapper from "@/components/SidebarWrapper";
import ContentWrapper from "@/components/ContentWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BetApp - Sports Betting Platform",
  description:
    "Professional sports betting platform with live odds and markets",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ReduxProvider>
          <SidebarProvider>
            <div className=" bg-gray-100">
              {/* INFO: Header- */}
              <div>
                <Header />
              </div>

              {/* Main Content Area */}
              <div className="flex">
                {/* Fixed Sidebar */}
                <SidebarWrapper />

                {/* Main Content Area with Secondary Navigation */}
                <ContentWrapper>{children}</ContentWrapper>
              </div>
            </div>
          </SidebarProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
