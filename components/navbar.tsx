import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { useAuth } from "@/context/AuthContext";
import { getUserAvatarUrl } from "@/lib/avatar";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  Logo,
} from "@/components/icons";

export const Navbar = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [avatarKey, setAvatarKey] = useState(0);
  const [mobileGamesOpen, setMobileGamesOpen] = useState(false);


  // Force avatar refresh when user changes
  useEffect(() => {
    if (user) {
      setAvatarKey((prev: number) => prev + 1);
    }
  }, [user?.id, user?.nama_lengkap]);

  // Close mobile games dropdown when pathname changes
  useEffect(() => {
    setMobileGamesOpen(false);
  }, [pathname]);

  // Get current role context based on pathname
  const getCurrentRoleContext = () => {
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/moderator')) return 'moderator';
    if (pathname.startsWith('/user')) return 'user';
    return user?.role || 'user';
  };

  // Dynamic navigation items based on user role and current path
  const getNavItems = () => {
    if (!isAuthenticated || !user) {
      return siteConfig.navItems; // Default items for non-authenticated users
    }

    // Determine current role context from pathname
    const currentRoleContext = getCurrentRoleContext();

    switch (currentRoleContext) {
      case 'admin':
        return [
          { label: "Dashboard", href: "/admin" },
          { label: "Pengurus", href: "/admin/pengurus" },
          { label: "Periode", href: "/admin/periode" },
          { label: "Prestasi", href: "/admin/prestasi" }
        ];
      case 'moderator':
        return [
          { label: "Dashboard", href: "/moderator" },
          { label: "Users", href: "/moderator/users" },
          { label: "Jadwal Pertemuan", href: "/moderator/jadwal-pertemuan" },
          { label: "Informasi", href: "/moderator/informasi" },
          { label: "Event", href: "/moderator/events" }
        ];
      case 'user':
        return [
          { label: "Dashboard", href: "/user" },
          { label: "History Pertemuan", href: "/user/history" },
          // { label: "Event", href: "/user/events" },
          // { label: "Team", href: "/user/team" },
          { 
            label: "Games", 
            href: "/user/games",
            isDropdown: true,
            dropdownItems: [
              { label: "Shuffle", href: "/user/games/shuffle" },
              { label: "Tebak Gambar", href: "/user/games/tebak-gambar" },
              { label: "Tebak Gambar 2", href: "/user/games/tebak-gambar-2" },
              { label: "Cek Region", href: "/user/games/cek-region" },
              // { label: "First Purchase", href: "/user/games/fp" }
            ]
          }
        ];
      default:
        return siteConfig.navItems;
    }
  };

  // Dynamic menu items for mobile
  const getNavMenuItems = () => {
    if (!isAuthenticated || !user) {
      return siteConfig.navMenuItems; // Default items for non-authenticated users
    }

    // Determine current role context from pathname
    const currentRoleContext = getCurrentRoleContext();

    switch (currentRoleContext) {
      case 'admin':
        return [
          { label: "Dashboard", href: "/admin" },
          { label: "Pengurus", href: "/admin/pengurus" },
          { label: "Periode", href: "/admin/periode" },
          { label: "Prestasi", href: "/admin/prestasi" }
        ];
      case 'moderator':
        return [
          { label: "Dashboard", href: "/moderator" },
          { label: "Users", href: "/moderator/users" },
          { label: "Jadwal Pertemuan", href: "/moderator/jadwal-pertemuan" },
          { label: "Informasi", href: "/moderator/informasi" },
          { label: "Event", href: "/moderator/events" }
        ];
      case 'user':
        return [
          { label: "Dashboard", href: "/user" },
          { label: "History Pertemuan", href: "/user/history" },
          // { label: "Event", href: "/user/events" },
          // { label: "Team", href: "/user/team" },
         { 
            label: "Games", 
            href: "/user/games",
            isDropdown: true,
            dropdownItems: [
              { label: "Shuffle", href: "/user/games/shuffle" },
              { label: "Tebak Gambar", href: "/user/games/tebak-gambar" },
              { label: "Tebak Gambar 2", href: "/user/games/tebak-gambar-2" },
              { label: "Cek Region", href: "/user/games/cek-region" },
              // { label: "First Purchase", href: "/user/games/fp" }
            ]
          }
        ];
      default:
        return siteConfig.navMenuItems;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // The logout function in AuthContext already handles the redirect
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback redirect in case of error
      router.push('/');
    }
  };

  const handleProfileAction = async (key: string) => {
    switch (key) {
      case 'profile-info-desktop':
      case 'profile-info-mobile':
        // These are header items, don't perform any action
        return;
      case 'profile':
        const currentRoleContext = getCurrentRoleContext();
        if (currentRoleContext === 'admin') {
          router.push('/admin/profile');
        } else if (currentRoleContext === 'moderator') {
          router.push('/moderator/profile');
        } else {
          router.push('/user/profile');
        }
        break;
      case 'switch-to-admin':
        router.push('/admin');
        break;
      case 'switch-to-moderator':
        router.push('/moderator');
        break;
      case 'switch-to-user':
        router.push('/user');
        break;
      case 'logout':
        await handleLogout();
        break;
      default:
        break;
    }
  };

  // Get role switching options based on current context and user role
  const getRoleSwitchingOptions = () => {
    const currentRoleContext = getCurrentRoleContext();
    const userRole = user?.role;

    if (!userRole) return [];

    const options = [];

    if (userRole === 'admin') {
      if (currentRoleContext === 'admin') {
        options.push(
          { key: 'switch-to-moderator', label: 'Beralih ke Moderator' },
          { key: 'switch-to-user', label: 'Beralih ke User' }
        );
      } else if (currentRoleContext === 'moderator') {
        options.push(
          { key: 'switch-to-admin', label: 'Beralih ke Admin' },
          { key: 'switch-to-user', label: 'Beralih ke User' }
        );
      } else if (currentRoleContext === 'user') {
        options.push(
          { key: 'switch-to-admin', label: 'Beralih ke Admin' },
          { key: 'switch-to-moderator', label: 'Beralih ke Moderator' }
        );
      }
    } else if (userRole === 'moderator') {
      if (currentRoleContext === 'moderator') {
        options.push({ key: 'switch-to-user', label: 'Beralih ke User' });
      } else if (currentRoleContext === 'user') {
        options.push({ key: 'switch-to-moderator', label: 'Beralih ke Moderator' });
      }
    }
    // User role has no switching options
    return options;
  };

  return (
  <HeroUINavbar maxWidth="xl" position="sticky" className="fixed top-0 left-0 right-0 w-full z-[999] border-b-2 border-[#1A237E] shadow-[0_0_32px_0_#1A237E] backdrop-blur-lg bg-background/70 print:hidden">
      {/* Logo di kiri */}
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold font-[orbitron] text-2xl text-[#FFD700]">COSMIC</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/* Menu navigasi di tengah */}
      <div className="absolute left-1/2 top-0 transform -translate-x-1/2 h-full flex items-center">
        <ul className="hidden lg:flex gap-8">
          {getNavItems().map((item) => (
            <NavbarItem key={item.href}>
              {item.isDropdown ? (
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="light"
                      className={clsx(
                        linkStyles({ color: "foreground" }),
                        "data-[active=true]:text-primary data-[active=true]:font-medium p-0 h-auto bg-transparent",
                        pathname.startsWith(item.href) && "text-primary font-medium"
                      )}
                    >
                      {item.label}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label={`${item.label} menu`}>
                    {item.dropdownItems?.map((dropdownItem) => (
                      <DropdownItem key={dropdownItem.href}>
                        <NextLink href={dropdownItem.href} className="w-full block">
                          {dropdownItem.label}
                        </NextLink>
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              ) : (
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "data-[active=true]:text-primary data-[active=true]:font-medium",
                  )}
                  color="foreground"
                  href={item.href}
                >
                  {item.label}
                </NextLink>
              )}
            </NavbarItem>
          ))}
        </ul>
      </div>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {/* <ThemeSwitch /> */}
        
        {/* Don't render anything while loading */}
        {!isLoading && (
          <>
            {/* Jika user sudah login, tampilkan avatar dropdown */}
            {isAuthenticated && user ? (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <button 
                    key={`desktop-${avatarKey}`}
                    className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400 transition-transform hover:scale-105 cursor-pointer focus:outline-none"
                  >
                    <img 
                      src={getUserAvatarUrl(user, 40, true)} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/logc.webp';
                      }}
                    />
                  </button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Profile Actions" 
                  variant="flat"
                  onAction={(key) => handleProfileAction(key as string)}
                >
                  <DropdownItem key="profile-info-desktop" className="h-14 gap-2">
                    <p className="font-semibold">Signed in as</p>
                    <p className="font-semibold text-yellow-400">{user.nama_lengkap || user.email}</p>
                  </DropdownItem>
                  <DropdownItem key="profile">
                    Profile
                  </DropdownItem>
                  <>
                    {getRoleSwitchingOptions().map((option) => (
                      <DropdownItem key={option.key}>
                        {option.label}
                      </DropdownItem>
                    ))}
                  </>
                  <DropdownItem key="logout" color="danger">
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : (
              /* Jika user belum login, tampilkan tombol login */
              <NavbarItem>
                <Button
                  as={NextLink}
                  href="/auth/login"
                  size="sm"
                  className="w-full md:w-[110px] bg-[#FFD700] text-black font-['Orbitron',sans-serif] text-lg font-bold py-2 rounded-md hover:bg-[#FFC300] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Login
                </Button>
              </NavbarItem>
            )}
          </>
        )}
        
        {/* <NavbarItem className="hidden sm:flex gap-2">
          <Link isExternal aria-label="Twitter" href={siteConfig.links.twitter}>
            <TwitterIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="Discord" href={siteConfig.links.discord}>
            <DiscordIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="Github" href={siteConfig.links.github}>
            <GithubIcon className="text-default-500" />
          </Link>
        </NavbarItem>
        <NavbarItem className="hidden md:flex">
          <Button
            isExternal
            as={Link}
            className="text-sm font-normal text-default-600 bg-default-100"
            href={siteConfig.links.sponsor}
            startContent={<HeartFilledIcon className="text-danger" />}
            variant="flat"
          >
            Sponsor
          </Button>
        </NavbarItem> */}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        {/* <ThemeSwitch /> */}
        
        {/* Don't render anything while loading */}
        {!isLoading && (
          <>
            {/* Avatar untuk mobile jika user sudah login */}
            {isAuthenticated && user ? (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <button 
                    key={`mobile-${avatarKey}`}
                    className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400 transition-transform hover:scale-105 cursor-pointer focus:outline-none"
                  >
                    <img 
                      src={getUserAvatarUrl(user, 40, true)} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/logc.webp';
                      }}
                    />
                  </button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Profile Actions" 
                  variant="flat"
                  onAction={(key) => handleProfileAction(key as string)}
                >
                  <DropdownItem key="profile-info-mobile" className="h-14 gap-2">
                    <p className="font-semibold">Signed in as</p>
                    <p className="font-semibold text-yellow-400">{user.nama_lengkap || user.email}</p>
                  </DropdownItem>
                  <DropdownItem key="profile">
                    Profile
                  </DropdownItem>
                  <>
                  {getRoleSwitchingOptions().map((option) => (
                    <DropdownItem key={option.key}>
                      {option.label}
                    </DropdownItem>
                  ))}
                  </>
                  <DropdownItem key="logout" color="danger">
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : (
              /* Jika user belum login, tampilkan tombol login untuk mobile */
              <Button
                as={NextLink}
                href="/auth/login"
                size="sm"
                className="bg-[#FFD700] text-black font-['Orbitron',sans-serif] text-sm font-bold px-3 py-1 rounded-md hover:bg-[#FFC300] transition-colors duration-200"
              >
                Login
              </Button>
            )}
          </>
        )}
        
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {getNavMenuItems().map((item, index) => {
            const isActive = pathname === item.href;
            
            // Handle dropdown items (like Games)
            if (item.isDropdown && item.dropdownItems) {
              return (
                <div key={`${item.label}-${index}`} className="flex flex-col">
                  <NavbarMenuItem>
                    <Button
                      variant="light"
                      className={clsx(
                        "w-full justify-start text-lg px-0",
                        mobileGamesOpen ? "text-primary" : "text-foreground"
                      )}
                      onPress={() => setMobileGamesOpen(!mobileGamesOpen)}
                      endContent={
                        <span className={clsx(
                          "transition-transform duration-200",
                          mobileGamesOpen ? "rotate-180" : "rotate-0"
                        )}>
                          ▼
                        </span>
                      }
                    >
                      {item.label}
                    </Button>
                  </NavbarMenuItem>
                  
                  {/* Dropdown items */}
                  {mobileGamesOpen && (
                    <div className="flex flex-col ml-4 mt-1 gap-1">
                      {item.dropdownItems.map((subItem, subIndex) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <NavbarMenuItem key={`${subItem.label}-${subIndex}`}>
                            <Link
                              color={isSubActive ? "primary" : "foreground"}
                              href={subItem.href}
                              size="md"
                              className="pl-2"
                            >
                              {subItem.label}
                            </Link>
                          </NavbarMenuItem>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            // Regular menu items
            return (
              <NavbarMenuItem key={`${item.label}-${index}`}>
                <Link
                  color={isActive ? "primary" : "foreground"}
                  href={item.href}
                  size="lg"
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            );
          })}
          {/* Add logout button for mobile */}
          {isAuthenticated && user && (
            <NavbarMenuItem>
              <Link
                color="danger"
                size="lg"
                onPress={() => handleLogout()}
              >
                Log Out
              </Link>
            </NavbarMenuItem>
          )}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
