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

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { useAuth } from "@/context/AuthContext";
import { getUserAvatarUrl, generateInitials } from "@/lib/avatar";
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

  // Debug logging
  console.log('Navbar render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user?.email);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleProfileAction = (key: string) => {
    switch (key) {
      case 'profile':
        router.push('/user');
        break;
      case 'dashboard':
        if (user?.role === 'admin') {
          router.push('/admin');
        } else if (user?.role === 'moderator') {
          router.push('/moderator');
        } else {
          router.push('/user');
        }
        break;
      case 'jadwal-pertemuan':
        router.push('/moderator/jadwal-pertemuan');
        break;
      case 'users':
        router.push('/moderator/users');
        break;
      case 'settings':
        router.push('/user/settings');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  return (
    <HeroUINavbar maxWidth="xl" position="sticky" className="border-b-2 border-[#1A237E] shadow-[0_0_32px_0_#1A237E] relative">
      {/* Logo di kiri */}
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">COSMIC</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/* Menu navigasi di tengah */}
      <div className="absolute left-1/2 top-0 transform -translate-x-1/2 h-full flex items-center">
        <ul className="hidden lg:flex gap-8">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
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
            </NavbarItem>
          ))}
        </ul>
      </div>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <ThemeSwitch />
        
        {/* Don't render anything while loading */}
        {!isLoading && (
          <>
            {/* Jika user sudah login, tampilkan avatar dropdown */}
            {isAuthenticated && user ? (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    isBordered
                    as="button"
                    className="transition-transform hover:scale-105"
                    color="warning"
                    name={generateInitials(user.nama_lengkap || user.email || 'User')}
                    size="sm"
                    src={getUserAvatarUrl(user, 40)}
                  />
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Profile Actions" 
                  variant="flat"
                  onAction={(key) => handleProfileAction(key as string)}
                >
                  <DropdownItem key="profile" className="h-14 gap-2">
                    <p className="font-semibold">Signed in as</p>
                    <p className="font-semibold text-yellow-400">{user.nama_lengkap || user.email}</p>
                  </DropdownItem>
                  <DropdownItem key="dashboard">
                    Dashboard
                  </DropdownItem>
                  {user.role === 'moderator' || user.role === 'admin' ? (
                    <>
                      <DropdownItem key="jadwal-pertemuan">
                        Jadwal Pertemuan
                      </DropdownItem>
                      <DropdownItem key="users">
                        Kelola Users
                      </DropdownItem>
                    </>
                  ) : null}
                  <DropdownItem key="settings">
                    Settings
                  </DropdownItem>
                  <DropdownItem key="help">
                    Help & Support
                  </DropdownItem>
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
        <ThemeSwitch />
        
        {/* Don't render anything while loading */}
        {!isLoading && (
          <>
            {/* Avatar untuk mobile jika user sudah login */}
            {isAuthenticated && user ? (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    isBordered
                    as="button"
                    className="transition-transform hover:scale-105"
                    color="warning"
                    name={generateInitials(user.nama_lengkap || user.email || 'User')}
                    size="sm"
                    src={getUserAvatarUrl(user, 40)}
                  />
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Profile Actions" 
                  variant="flat"
                  onAction={(key) => handleProfileAction(key as string)}
                >
                  <DropdownItem key="profile" className="h-14 gap-2">
                    <p className="font-semibold">Signed in as</p>
                    <p className="font-semibold text-yellow-400">{user.nama_lengkap || user.email}</p>
                  </DropdownItem>
                  <DropdownItem key="dashboard">
                    Dashboard
                  </DropdownItem>
                  {user.role === 'moderator' || user.role === 'admin' ? (
                    <>
                      <DropdownItem key="jadwal-pertemuan">
                        Jadwal Pertemuan
                      </DropdownItem>
                      <DropdownItem key="users">
                        Kelola Users
                      </DropdownItem>
                    </>
                  ) : null}
                  <DropdownItem key="settings">
                    Settings
                  </DropdownItem>
                  <DropdownItem key="help">
                    Help & Support
                  </DropdownItem>
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
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                color={
                  index === 2
                    ? "primary"
                    : index === siteConfig.navMenuItems.length - 1
                      ? "danger"
                      : "foreground"
                }
                href="#"
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
