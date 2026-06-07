# Dual Job Date Web

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

The Web-Portal can be accessed here: [https://dualjobdating.vercel.app/](https://dualjobdating.vercel.app/).

## Getting Started

First run installation
```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


### Invite-based Workflow

Students and companies are not created directly.  
Instead, an invite-based workflow is used.

- When adding a new student or company, an API request (`/invite`) is triggered
- The user receives an invitation to register
- The account becomes active only after completing the registration process

This implementation follows the backend API specification:  
https://jobdatingbackend.stoplight.io/docs/dualjobdating/


### Excel Import

An Excel import for students and companies is implemented.

- Upload `.xlsx` / `.xls`
- Data is validated and processed
- Invalid rows are skipped

For detailed requirements see:
`dokumentation.md`


## Testing
Tests are located in the `__tests__` directory.

Basic unit and component tests are implemented using Jest and React Testing Library.

### Setup

The testing environment is configured with:
- jest for running tests
- ts-jest for TypeScript support
- jest-environment-jsdom for DOM simulation
- @testing-library/react for testing React components
- @testing-library/jest-dom for extended matchers

### Run Tests
```
npm run test
```



## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The project can be deployed manually using the Vercel CLI.

Install the Vercel CLI:

```bash
npm install -g vercel
```

Log in:

```bash
vercel login
```

From the project root, where `package.json` is located, run:

```bash
vercel
```

This creates a preview deployment.

To deploy directly to production, run:

```bash
vercel --prod
```

Before deploying, it's recommended to check that the project builds successfully:

```bash
npm run build
```

### Vercel Environment Variables

The following environment variables must be configured in the Vercel dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_BASE_URL=...
```

In Vercel, go to:

```text
Project Settings → Environment Variables
```

After changing environment variables, redeploy the project so the new values are applied.

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used for Supabase authentication.
- `NEXT_PUBLIC_API_BASE_URL` must point to the backend API base URL.
- Use the hosted backend domain instead of a raw IP address.
- The current production deployment is: https://dualjobdating.vercel.app
