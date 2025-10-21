"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";

import { useTheme } from "next-themes";
import {
  LayoutGrid,
  BookOpen,
  Sparkles,
  Send,
  Settings,
  Menu,
  X,
  User,
  LogOut,
  Plus,
  AlertTriangle,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useAuthProfileGetProfile,
  useAuthProfileLogout,
} from "@/services/auth.api";
import {
  ACCESS_TOKEN_KEY,
  DEFAULT_USER_AVATAR,
  LOGIN_URL,
  REFRESH_TOKEN_KEY,
} from "@/constants";
import { useBusinessGetAll } from "@/services/business.api";
import { showToast } from "@/helper/show-toast";
import { useLocale, useTranslations } from "next-intl";
import { useTokenGetTokenUsage } from "@/services/tier/token.api";
import { useSubscribtionGetSubscription } from "@/services/tier/subscribtion.api";
import { useDateFormat } from "@/hooks/use-date-format";


export function MobileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { formatDate } = useDateFormat();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(theme === "dark");
  const { data: profileData } = useAuthProfileGetProfile();
  const profile = profileData?.data?.data;
  const { data: businessesData } = useBusinessGetAll();
  const businesses = businessesData?.data?.data || [];
  const { businessId } = useParams() as { businessId?: string };
  const currentBusiness =
  businesses.find((business) => business.id === businessId) || null;
  const userRole = currentBusiness?.userPosition?.role;
  const tSideBar = useTranslations("sideBar");
  const navigationItems = [
    {
      name: tSideBar("dashboard"),
      href: "dashboard",
      icon: LayoutGrid,
    },
    {
      name: tSideBar("basicKnowledge"),
      href: "knowledge-base",
      icon: BookOpen,
    },
    {
      name: tSideBar("contentGenerate"),
      href: "content-generate",
      icon: Sparkles,
    },
    {
      name: tSideBar("contentScheduler"),
      href: "content-scheduler",
      icon: Send,
    },
    {
      name: tSideBar("settings"),
      href: "settings",
      icon: Settings,
    },
    {
      name: tSideBar("profile"),
      href: "profile",
      icon: User,
    },
  ];
  
  // Get subscription data
  const { data: subscriptionData } = useSubscribtionGetSubscription(
    businessId ?? ""
  );
  const subscription = subscriptionData?.data?.data ?? null;
  
  // Get token usage data
  const { data: tokenUsageData } = useTokenGetTokenUsage(businessId ?? "");
  const credits = tokenUsageData?.data?.data?.availableToken ?? 0;
  const locale = useLocale();
  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    setTheme(checked ? "dark" : "light");
  };

  const mLogout = useAuthProfileLogout();
  const tToast = useTranslations();
  
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await mLogout.mutateAsync(refreshToken);
      }
    } catch {
    } finally {
      showToast("success", tToast("toast.auth.logoutSuccess"), tToast);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.location.href = LOGIN_URL;
    }
  };

  // Check if we're currently inside a business context
  const isInBusinessContext = () => {
    const pathSegments = pathname.split("/").filter(Boolean);
    // We're in business context if we have at least 2 segments and first one is not a known root page
    return (
      pathSegments.length >= 2 &&
      !["profile", "pricing", "checkout", "newbusiness"].includes(
        pathSegments[0]
      )
    );
  };

  // Get filtered navigation items based on context
  const getFilteredNavigationItems = () => {
    if (isInBusinessContext()) {
      // Show all navigation items when in business context
      return navigationItems;
    } else {
      // Show only profile when not in business context
      return navigationItems.filter((item) => item.href === "profile");
    }
  };

  const handleNavigation = (href: string) => {
    // Handle profile differently - don't go through businessId
    if (href === "profile") {
      router.push(`/${href}`);
    } else {
      const fullPath = `/business/${businessId}/${href}`;
      router.push(fullPath);
    }

    setIsOpen(false);
  };

  const handleExternalClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <>
      {/* Burger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 hover:bg-muted"
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-card border-l border-border shadow-xl animate-in slide-in-from-right duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Profile Section */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage
                        src={profile?.image || DEFAULT_USER_AVATAR}
                        alt={profile?.name || "U"}
                      />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {profile?.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {profile?.name || "Pengguna"}
                      </span>
                      {userRole && (
                        <span className="text-xs text-muted-foreground">
                          {userRole || "Pengguna"}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Theme Toggle Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleThemeToggle(!isDarkMode)}
                    className="p-2 h-8 w-8 border-border hover:bg-muted transition-all duration-200 rounded-lg"
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {isDarkMode ? (
                      <Sun className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Moon className="h-4 w-4 text-slate-600" />
                    )}
                  </Button>
                </div>
              </div>

               {/* Subscription Info Section */}
               {businessId && (
                 <div className="p-4 border-b border-border">
                   <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                       <span className="text-sm text-muted-foreground">
                         {subscription?.subscription?.productName || "Paket Gratis"}
                       </span>
                       {subscription?.expiredAt && (
                         <span className="text-xs text-muted-foreground">
                           {tSideBar("validUntil")}{" "}
                           {formatDate(new Date(subscription.expiredAt))}
                         </span>
                       )}
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{credits.toLocaleString(locale)}</span>
                         <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                         <span className="text-xs text-muted-foreground">{tSideBar("token")}</span>
                       </div>
                     </div>
                     <button
                       onClick={() => {
                         router.push(`/business/${businessId}/pricing`);
                         setIsOpen(false);
                       }}
                       className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                     >
                       <Plus className="w-4 h-4 text-white" />
                     </button>
                   </div>
                 </div>
               )}

              

              {/* Navigation Menu */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                  <h3 className="text-sm font-medium text-muted-foreground px-2 py-2">
                    Navigasi
                  </h3>
                  <div className="space-y-1">
                    {getFilteredNavigationItems().map((item) => {
                      const isActive = pathname.endsWith(`/${item.href}`);
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.name}
                          onClick={() => handleNavigation(item.href)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group",
                            isActive
                              ? "bg-blue-600 text-white shadow-md"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted hover:shadow-sm"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5 transition-transform duration-200",
                              isActive ? "" : "group-hover:scale-110"
                            )}
                          />
                          <span className="text-sm font-medium">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div className="p-4 border-t border-border space-y-3">
                {/* Report Problem Button */}
                <Button
                  variant="ghost"
                  onClick={() => handleExternalClick("https://forms.gle/fZAF7zGQZcdvyVzy9")}
                  className="w-full justify-start text-orange-600 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors duration-200"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span>{tSideBar("reportIssue")}</span>
                </Button>

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors duration-200"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{tSideBar("logout")}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
