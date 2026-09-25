# Product dashboard

A small product admin app built with Next.js, React, Tailwind CSS, and Axios. It uses the [DummyJSON API](https://dummyjson.com/docs) for authentication and product data.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open [http://localhost:3000](http://localhost:3000).

Use the demo account `emilys` with password `emilyspass`.

To check the project, run `npm run typecheck`, `npm run lint`, and `npm run build`.

## What is included

- Login with error feedback, a protected product area, and logout.
- A product table on larger screens and cards on smaller screens.
- Server pagination with 10, 20, or 50 products per page.
- Search with a short delay, category filtering, and sorting by name, price, or rating.
- A product page with images, description, price, stock, and reviews.
- Forms for adding and editing products, with validation and a confirmation step for deleting.
- Loading, empty, not found, and retry states.
- Page, size, search, category, and sort values in the URL.

## Choices and tradeoffs

All requests use one Axios instance in `src/lib/api.ts`. It adds the access token to requests and handles request errors in one place. List requests use an abort signal, so a slower request cannot replace newer search results. The search input waits 450 milliseconds before changing the URL and requesting data. Invalid page and size values fall back to safe values, and a page beyond the last result returns to the last page.

DummyJSON offers separate search and category endpoints. The app makes these controls mutually exclusive. Starting a search clears the category. Choosing a category clears the search. This keeps pagination and sorting on the server instead of pretending that a filter on one loaded page covers the full catalog.

DummyJSON simulates product writes and does not save them. Successful changes are stored in this browser and layered over later API reads. Added products appear at the start of the first page of a matching view. Because the server does not know about these local changes, page boundaries and sort order around added or removed items can differ from a real database. A production app would store changes on a server and use a server managed session. This demo keeps its access token in browser storage and uses a cookie to protect routes in Next.js middleware.

## A problem I worked through

Search results can arrive out of order if someone types quickly or the API is slow. I tied each list request to an `AbortController` and cancel it when the filters change or the component leaves the page. I also cancel the active request as soon as the search input changes, before the debounce finishes. You can test this by adding `&delay=2000` to the API request URL in `src/lib/api.ts` while developing and typing a few searches in quick succession.

## AI help

AI helped scaffold the app, shape the visual design, and review the implementation. I checked the API behavior against the DummyJSON documentation and verified the project with the commands above. The code and decisions should be reviewed and understood before making further changes.

## Deployment

The app can be deployed to Vercel by importing this repository. It does not require environment variables. The deployment should use `npm run build` and the standard Next.js output.
