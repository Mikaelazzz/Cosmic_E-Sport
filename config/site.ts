export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Cosmic E-Sport",
  // description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    {
      label: "Home",
      href: "/#home",
    },
    {
      label: "Tentang",
      href: "/#tentang",
    },
    {
      label: "Pengurus",
      href: "/#pengurus",
    },
    {
      label: "Prestasi",
      href: "/#prestasi",
    }
  ],
  navMenuItems: [
    {
      label: "Home",
      href: "/#home",
    },
    {
      label: "Tentang",
      href: "/#tentang",
    },
    {
      label: "Pengurus",
      href: "/#pengurus",
    },
    {
      label: "Prestasi",
      href: "/#prestasi",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
