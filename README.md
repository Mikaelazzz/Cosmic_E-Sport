# Next.js & HeroUI Template

This is a template for creating applications using Next.js 14 (app directory) and HeroUI (v2).

[Try it on CodeSandbox](https://githubbox.com/heroui-inc/heroui/next-app-template)

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [HeroUI v2](https://heroui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)

## How to Use

### Use the template with create-next-app

To create a new project based on this template using `create-next-app`, run the following command:

```bash
npx create-next-app -e https://github.com/heroui-inc/next-app-template
```

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## License

Licensed under the [MIT license](https://github.com/heroui-inc/next-app-template/blob/main/LICENSE).


## Feature 

### Auth

[x] Login

[x] Register with Verifikassi Email

[x] Forgot Password with Verifikasi Email

[ ] Template HTML Email

[ ] On Going Other Feature

### Admin 

[x] CRUD Periode 

[x] CRUD Pengurus by NIM

[x] CRUD Prestasi

[ ] On Going Other Feature

[ ] 

### Moderator 

[x] CRUD User > Role Anggota 

[x] CRUD Pertemuan Rutin 

[ ] Managing Team

[ ] CRUD Event 

[x] Fungsi Absen pada Pertemuan Rutin

[ ] CRUD Informasi

### User 

[ ] CRUD Team

[ ] Join Event Team / Individual

[ ] Join Pertemuan Rutin > Scan QR Absen

[ ] Get Informasi 

### Other Feature

[ ] Games

[ ] Notifikasi WEB dan HP 

[ ] Animasi yang keren untuk Website

[ ] Intro saat masuk Dashboard

[x] Cookie Akun