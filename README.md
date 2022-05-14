# React Router Isomorphic Link

## One Component to rule them all links!

This packages provides a single isomorphic link component that wraps around [React Router's NavLink](https://v5.reactrouter.com/web/api/NavLink) component and the native anchor tag. It provides a simple API to manage both outgoing and internal hrefs through one component!

## Installation

### npm

```bash
npm i react-router-isomorphic-link
```

### yarn

```bash
yarn add react-router-isomorphic-link
```

## When to use this package?

TL;DR: This packages is inteded to support uniform handling and styling of all links within one component.

### Limitations of React Router

React Router's Link component does not support outgoing hrefs or URLs to internal pages.

```jsx
import { Link } from 'react-router-dom';

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

Sometimes you have to dynamically map hrefs to a link component. If your hrefs include both internal and external locations, it can be hard to make it work with React Router's Link component. Most likely, you will need to write custom logic. This is what this packages does for you!

### Links in Markdown

To give you one example, whenever I work with MDX or Markdown, I find myself using internal paths, outgoing/external URLs, and sometimes even internal links that include my domain in the same markdown file.

```markdown
# Welcome to my documentation

Go to the [dashboard](https://my-cool-site.com/dashboard#create) to create a new project.

If you have questions, please contact us [via](mailto:help@my-cool-site.com) or
[on Twitter](https://twitter.com/my-cool-site).
```

The first href is a "full" URL to an internal page, the second should be handled as an email address, and the third one is a URL to an external website. I want all of them to work in markdown previews (like on GitHub or VS Code) and within my application. That's what React Router Isomorphic Link is intended for!

I mostly use [rehype](https://www.npmjs.com/package/rehype) to map markdown to custom React components. Unfortunately, React Router's Link component does not support outgoing links or full URLs to internal pages. So I find myself repeatedly creating small wrappers around the Link component.

## Feedback & Issues

Please provide your [feedback](https://github.com/andrelandgraf/react-router-isomorphic-link/issues) on GitHub!

## Versions

- Version 0.x.x implements the inital version of the IsomorphicLink link component and the useIsomorphicNavigate hook in TypeScript.

### Changelog

👀

## Usage

This package exposes the following utilities:

- `IsomorphicLink` component
- `useIsomorphicNavigate` hook
- `NavigationContextProvider` context provider

And the following TypeScript types:

- `IsomorphicLinkProps`
- `NavigationContextProps`
- `IsomorphicNavigateFunction`

### IsomorphicLink

Supported features and how it works:

- Supports all React Router's NavLink props.
- Guesses if the supplied `to` prop is internal or external.
- Allows explicit override via `isExternal` prop.
- Utilizes config options from the NavigationContext.

#### Optional: Configuration via the NavigationProvider

Use the NavigationProvider to provide configuration options to the IsomorphicLink component:

```jsx
import { NavigationProvider } from 'react-router-isomorphic-link';
const host = process.env.NODE_ENV === 'production' ? 'your-domain.com' : 'localhost:3000';

const App = () => {
  return (
    <NavigationProvider host={host} useFinalSlash>
      ...
    </NavigationProvider>
  );
};
```

- `host` prop: Make sure to provide your host, so IsomorphicLink can strip your domain from internal pathnames to support SPA routing through React Router!
- `useFinalSlash` prop: Some hosts (like Netlify) redirect all paths to a path with a trailing slash. Set this to `true` to automatically add a trailing slash to internal paths to avoid redirects. Defaults to `false`, which will not add a trailing slash to internal paths.

#### isExternal prop

IsomorphicLink component is able identify external URLs and will render a native anchor element instead of the React Router Link component:

```jsx
import { IsomorphicLink } from 'react-router-isomorphic-link';

function MyComponent() {
  return <IsomorphicLink to="https://youtube.com">YouTube</IsomorphicLink>;
}
```

However, you can also explicitly tell IsomorphicLink to use or not use a native anchor tag for a link:

```jsx
import { IsomorphicLink } from 'react-router-isomorphic-link';

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

Additionally, IsomorphicLink specifies to additional classes that you can use to differ the styling of your outgoing and internal links.

- "isomorphic-link--internal" is only supplied to internal links.
- "isomorphic-link--external" is only supplied to outgoing links.
