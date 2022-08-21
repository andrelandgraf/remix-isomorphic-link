# Remix Isomorphic Link

## One Component to rule them all links!

This packages provides a single isomorphic link component that wraps around [Remix's NavLink](https://remix.run/docs/en/v1/api/remix#navlink) component and the native anchor tag. It provides a simple API to manage both outgoing and internal hrefs through one component!

**Note:** This package is a "fork" of [react-router-isomorphic-link](https://www.npmjs.com/package/react-router-isomorphic-link) that adds support for the ressource prefetching features of Remix.

## Installation

### npm

```bash
npm i remix-isomorphic-link
```

### yarn

```bash
yarn add remix-isomorphic-link
```

## When to use this package?

TL;DR: This packages is inteded to support uniform handling and styling of all links within one component.

### Limitations of Remix

Remix's Link component does not support outgoing hrefs or URLs to internal pages.

```jsx
import { Link } from '@remix-run/react';

function MyComponent() {
  return (
    <>
      <Link to="/contact">Internal absolute path</Link>
      <Link to="contact">Internal relative path</Link>
      Won't work: <Link to="https://hosted-domain.com/contact">URL to internal absolute path</Link>
      Won't work: <Link to="youtube.com">Outgoing href</Link>
      Won't work: <Link to="https://youtube.com">Outgoing URL</Link>
      Won't work: <Link to="mailto:jane.doe@mailserver.com">Non-http protocol href</Link>
    </>
  );
}
```

Sometimes you have to dynamically map hrefs to a link component. If your hrefs include both internal and external locations, it can be hard to make it work with Remix's Link component. Most likely, you will need to write custom logic. This is what this packages does for you!

### Links in Markdown

To give you one example, whenever I work with MDX or Markdown, I find myself using internal paths, outgoing/external URLs, and sometimes even internal links that include my domain in the same markdown file.

```markdown
# Welcome to my documentation

Go to the [dashboard](https://my-cool-site.com/dashboard#create) to create a new project.

If you have questions, please contact us via [email](mailto:help@my-cool-site.com) or [on Twitter](https://twitter.com/my-cool-site).
```

I mostly use [rehype](https://www.npmjs.com/package/rehype) to map Markdown to custom React components. Unfortunately, Remix's Link component does not support outgoing links or full URLs to internal pages. So I find myself repeatedly creating small wrappers around the Link component.

The first href is a "full" URL to an internal page, the second should be handled as an email address, and the third one is a URL to an external website. I want all them links to work in Markdown previews (like on GitHub or VS Code) and within my application. That's what Remix Isomorphic Link is intended for!

## Feedback & Issues

Please provide your [feedback](https://github.com/andrelandgraf/remix-isomorphic-link/issues) on GitHub!

## Versions

- Version 0.x.x implements the inital version of the IsomorphicLink link component and the useIsomorphicNavigate hook in TypeScript.

### Changelog

👀

## Usage

This package exposes the following utilities:

- `IsomorphicLink` component
- `useIsomorphicNavigate` hook
- `IsomorphicNavProvider` context provider
- `isomorphicClassName` function
- `isomorphicStyle` function

And the following TypeScript types:

- `IsomorphicLinkProps`
- `IsomorphicNavContextProps`
- `IsomorphicNavigateFunction`

### IsomorphicLink

Supported features and how it works:

- Supports all Remix's NavLink props.
- Guesses if the supplied `to` prop is internal or external.
- Allows explicit override via `isExternal` prop.
- Utilizes config options from the IsomorphicNavContext.

#### Optional: Configuration via the IsomorphicNavProvider

Use the IsomorphicNavProvider to provide configuration options to the IsomorphicLink component:

```jsx
import { IsomorphicNavProvider } from 'remix-isomorphic-link';
const host = process.env.NODE_ENV === 'production' ? 'your-domain.com' : 'localhost:3000';

const App = () => {
  return (
    <IsomorphicNavProvider host={host} defaultPrefetch="intent" useTrailingSlash openOutgoingAsBlank>
      ...
    </IsomorphicNavProvider>
  );
};
```

- `host` prop: Make sure to provide your host, so IsomorphicLink can strip your domain from internal pathnames to support SPA routing through Remix!
- `useTrailingSlash` prop: Some hosts (like Netlify) redirect all paths to a path with a trailing slash. Set this to `true` to automatically add a trailing slash to internal paths to avoid redirects. Defaults to `false`, which will not add a trailing slash to internal paths.
- `openOutgoingAsBlank` prop: Set a policy to open all identified outgoing links in a new tab/window. Defaults to `false`, which will open outgoing links in the same tab/window.
- `defaultPrefetch` prop: Set a policy to prefetch all identified internal links using Remix's prefetch feature. Defaults to `none` (default in Remix), which will not prefetch outgoing links.

**How to best pass the host to IsomorphicNavProvider?**

Kent uses [this neat function](https://github.com/kentcdodds/kentcdodds.com/blob/ebb36d82009685e14da3d4b5d0ce4d577ed09c63/app/utils/misc.tsx#L229-L237) to calculate the domain URL of an application. We can adapt the function a little to get the current host.

````tsx
export function getHost(request: Request) {
  const host = request.headers.get('X-Forwarded-Host') ?? request.headers.get('host');
  if (!host) {
    throw new Error('Could not determine domain host.');
  }
  return host;
}

export function loader({ request }: LoaderArgs) {
  const host = getHost(request);
  return { host };
}

export default function Root() {
  const { host } = useLoaderData();
  return (
    <IsomorphicNavProvider host={host}>
      ...
    </IsomorphicNavProvider>
  );
}
```

#### isExternal prop

IsomorphicLink component is able identify external URLs and will render a native anchor element instead of the Remix Link component:

```jsx
import { IsomorphicLink } from 'remix-isomorphic-link';

function MyComponent() {
  return <IsomorphicLink to="https://youtube.com">YouTube</IsomorphicLink>;
}
````

However, you can also explicitly tell IsomorphicLink to use or not use a native anchor tag for a link:

```jsx
import { IsomorphicLink } from 'remix-isomorphic-link';

function MyComponent() {
  return (
    <IsomorphicLink to="youtube.com" isExternal>
      YouTube
    </IsomorphicLink>
  );
}
```

In this case, IsomorphicLink won't guess but just follow the `isExternal` prop.

**Note:** You **must** use valid URLs (including the protocol e.g., https) for outgoing hrefs if you want to omit the `isExternal` property. Otherwise, IsomorphicLink will treat your external href as an internal relative path (youtube.com vs. index.html).

#### Styling

You can use the NavLink className and style prop to style your link. Note that you can pass a function to both properties as documented in the [React Router documentation](https://v5.reactrouter.com/web/api/NavLink/classname-string-func). Note that for IsomorphicLink, `active` will always be `false` in case your href is outgoing.

Additionally, IsomorphicLink specifies two additional classes that you can use to differ the styling of your outgoing and internal links.

- "isomorphic-link" supplied to all links.
- "isomorphic-link--internal" is only supplied to internal links.
- "isomorphic-link--external" is only supplied to outgoing links.

#### isomorphicClassName & isomorphicStyle utilities

The `isomorphicClassName` and `isomorphicStyle` utilities are handy if you create further abstraction layers around the `IsomorphicLink` component and want to be able to make use of the [className function property](https://v5.reactrouter.com/web/api/NavLink/classname-string-func) of React Router's `NavLink` component.

As visible in the example, we wrap `IsomorphicLink` in a custom component, which itself might be wrapped in a higher order `StyledLink` component. The `isomorphicClassName` function is used to process the className prop in each of these higher order components to make sure both cases (string and func) are handeled correctly.

```tsx
import type { IsomorphicLinkProps } from 'remix-isomorphic-link';
import { IsomorphicLink, isomorphicClassName } from 'remix-isomorphic-link';

type UnstyledLinkProps = {
  outline?: 'normal' | 'small' | 'none';
} & IsomorphicLinkProps;

const UnstyledLink: FC<PropsWithChildren<UnstyledLinkProps>> = ({
  to,
  outline = 'small',
  children,
  className = '', // Note: className can again be a function and isomorphicClassName will make sure the function is called with the active prop.
  ...props
}) => {
  return (
    <IsomorphicLink
      {...props}
      to={to}
      className={({ isActive }) =>
        `${outline === 'none' ? '' : getAriaClasses(outline === 'small')} ${isomorphicClassName(className, active)}`
      }
    >
      {children}
    </IsomorphicLink>
  );
};
```
