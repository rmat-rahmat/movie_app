// Central config values for the app
// Base URL for API backend — read from environment so dev/prod can differ.
// Use NEXT_PUBLIC_BASE_URL which is exposed to both server and client in Next.js
// const DEFAULT_DEV = 'http://45.137.215.129:47080';
const DEFAULT_DEV = 'http://45.137.215.129:47080';

const DEFAULT_TEST= 'https://tv.0taik.co';

const DEFAULT_PROD="https://otalk.tv"

export const BASE_URL: string =DEFAULT_TEST;
	// process.env.NEXT_PUBLIC_BASE_URL ??
	// (process.env.NODE_ENV === 'production' ? DEFAULT_PROD : DEFAULT_DEV);
