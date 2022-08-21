import type { FC, PropsWithChildren, CSSProperties } from 'react';
import React, { useCallback, useContext, useMemo } from 'react';
import type { NavigateOptions, To } from 'react-router-dom';
import type { NavLinkProps } from '@remix-run/react';
import { NavLink, useNavigate } from '@remix-run/react';

interface HREF {
  href: string;
  prototcol: string;
  host: string;
  pathname: string;
  search: string;
  hash: string;
  isOutgoing: boolean;
  isAbsolute: boolean;
}

function throwError(message: string): never {
  throw new Error(`remix-isomorphic-link: ${message}`);
}

/**
 * An isomorphic function wrapper around React Router's NavLink className prop.
 */
const isomorphicClassName = (className: NavLinkProps['className'], isActive = false): string => {
  if (!className) {
    return '';
  }
  if (typeof className === 'string') {
    return className;
  }
  return className({ isActive }) || '';
};

/**
 * An isomorphic function wrapper around React Router's NavLink style prop.
 */
const isomorphicStyle = (style: NavLinkProps['style'], isActive = false): CSSProperties | undefined => {
  if (!style) {
    return undefined;
  }
  if (typeof style === 'function') {
    return style({ isActive });
  }
  return style;
};

/**
 * Check if supplied href is a valid URL or not.
 * Note "example.com/contact" is not a valid URL.
 * The protocol has to be supplied as well:
 * => "https://example.com/contact"
 * => "mailto:iron.man@gmail.com"
 * => "tel:+188899956754"
 */
function isUrl(href: string) {
  try {
    new URL(href);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if supplied URL uses the host of the application's domain.
 */
function isInHostDomain(url: URL, host?: string) {
  return url.host === host;
}

function urlToHref(url: URL, host?: string): HREF {
  return {
    href: url.href,
    prototcol: url.protocol,
    host: url.host,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    isOutgoing: !isInHostDomain(url, host),
    isAbsolute: true,
  };
}

/**
 * This functions aims to do as much guessing as possible to guess
 * if the supplied href is an internal or external link.
 */
function parseHref(href: string, host?: string, isExternal?: boolean): HREF {
  if (isUrl(href)) {
    // Note: mailto: and tel: protocols etc. are covered by this statement as well
    const url = new URL(href);
    return urlToHref(url, host);
  }
  if (isExternal) {
    return {
      href,
      prototcol: '',
      host: '',
      pathname: '',
      search: '',
      hash: '',
      isOutgoing: true,
      isAbsolute: true,
    };
  }
  /*
   * Now we can either have an internal absolute path like "/contact",
   * a relative path like "contact" or "index.html",
   * or a non-complete external URL like "youtube.com",
   * or a non-complete internal URL like "my-domain.com/contact".
   * We assume the link is internal if not otherwise specified
   *
   */
  let sanitizedHref = href;
  if (host && href.startsWith(host)) {
    sanitizedHref = href.substring(host.length);
  }
  const isAbsolute = sanitizedHref.startsWith('/');
  const fakeUrl = `https://remix-isomorphic-link.com${isAbsolute ? sanitizedHref : `/${sanitizedHref}`}`;
  const url = new URL(fakeUrl);
  return {
    href,
    prototcol: '',
    host: '',
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    isOutgoing: false,
    isAbsolute,
  };
}

/**
 * Why would we want to add final slashes?
 * Some hosts like Netlify redirect all pages
 * that do not end with a slash to a page that ends with a slash or vice-versa.
 *
 * For example:
 * Netlify redirects "/contact" to "/contact/" via 301 (permanent redirect).
 * For Google bots, this looks like you have a permanent redirect in your app,
 * which might hurt your SEO score (because of the redirect and the duplicate content).
 *
 * The solution:
 * Always use ending "/" everywhere (links, forms, sitemap, robots.txt, etc).
 * Problem solved!
 *
 * PS: If the user types "/contact" in the URL bar, Netlify will also redirect that to "/contact/"!
 */
function addFinalSlash(pathname: string): string {
  if (!pathname) {
    return '/';
  }
  if (pathname[pathname.length - 1] === '/') {
    return pathname;
  }
  return pathname + '/';
}

/**
 * Receives a to: To object or string and returns a string.
 * Possible values for to:
 * - "https://example.com"
 * - "/contact"
 * - "/contact?foo=bar#baz"
 * - "contact"
 * - { pathname: "/contact", search: "?foo=bar", hash: "#baz" }
 */
function sanitizeTo(
  to: To,
  useTrailingSlash = false,
  explicitlyOutgoing?: boolean,
  host?: string,
): [isExternal: boolean, to: To] {
  if (typeof to !== 'string' && explicitlyOutgoing) {
    throwError(
      'You specified "isExternal={true}" but provided a to prop of type Path. Please provide your href as a string if you want it to be used as an outgoing link. Type Path can only be used for internal links.',
    );
  }
  if (typeof to === 'string') {
    const href = parseHref(to, host, explicitlyOutgoing);
    if (href.isOutgoing) {
      return [true, to];
    }
    const sanitizedPath = useTrailingSlash ? addFinalSlash(href.pathname) : href.pathname;
    return [false, sanitizedPath + href.search + href.hash];
  }
  const { pathname, search, hash } = to;
  const sanitizedPathname = useTrailingSlash && pathname ? addFinalSlash(pathname) : pathname;
  return [false, { pathname: sanitizedPathname, search, hash }];
}

interface IsomorphicNavContextProps {
  host: string | undefined;
  useTrailingSlash?: boolean;
  openOutgoingAsBlank?: boolean;
  defaultPrefetch?: NavLinkProps['prefetch'];
}

/**
 * Provides further context for the IsomorphicLink component.
 * host: The host of your app, such as "example.com" or "localhost:8888"
 */
const IsomorphicNavContext = React.createContext<IsomorphicNavContextProps>({
  host: undefined,
  useTrailingSlash: false,
  openOutgoingAsBlank: false,
  defaultPrefetch: 'none',
});

const IsomorphicNavProvider: FC<PropsWithChildren<IsomorphicNavContextProps>> = ({ children, ...props }) => {
  return <IsomorphicNavContext.Provider value={props}>{children}</IsomorphicNavContext.Provider>;
};

/**
 * Simple hook that uses IsomorphicNavContext to sanitize a given to prop.
 */
function useSanitizedTo(to: To, explicitlyOutgoing?: boolean): [isExternal: boolean, to: To] {
  const { host, useTrailingSlash } = useContext(IsomorphicNavContext);
  return useMemo(
    () => sanitizeTo(to, useTrailingSlash, explicitlyOutgoing, host),
    [to, useTrailingSlash, explicitlyOutgoing, host],
  );
}

/**
 * IsomorphicProps for IsomorphicLink and useIsomorphicNavigate
 * isExternal: Explicitly tell the component to use an anchor tag instead of a link, e.g. to force a full page reload or to mark an href as external.
 */
interface IsomorphicProps {
  isExternal?: boolean;
}

type IsomorphicLinkProps = NavLinkProps & IsomorphicProps;
type IsomorphicNavigateFunction = (to: To, options?: NavigateOptions, props?: IsomorphicProps) => void;

/**
 * A wrapper around useNavigate that provides the same functionality as the IsomorphicLink component.
 */
const useIsomorphicNavigate = (): IsomorphicNavigateFunction => {
  const { host, useTrailingSlash } = useContext(IsomorphicNavContext);
  const navigate = useNavigate();
  const isomorphicNavigate: IsomorphicNavigateFunction = useCallback(
    (to, options?, props?) => {
      const [isExternal, sanitizedTo] = sanitizeTo(to, useTrailingSlash, props?.isExternal, host);
      if (isExternal) {
        window.location.href = sanitizedTo as string;
      } else {
        navigate(sanitizedTo, options);
      }
    },
    [navigate, host, useTrailingSlash],
  );
  return isomorphicNavigate;
};

/**
 * The isomorphic link component
 * - Same interface as the Remix's NavLink component.
 * - Wrap this component with the IsomorphicNavProvider to provider further configuration options.
 * - Explicitly force render as anchor tag by passing isExternal={true}
 */
const IsomorphicLink = React.forwardRef<HTMLAnchorElement, IsomorphicLinkProps>(
  (
    { to, isExternal, className, style, replace, state, reloadDocument, caseSensitive, end, children, ...props },
    ref,
  ) => {
    const { openOutgoingAsBlank, defaultPrefetch } = useContext(IsomorphicNavContext);
    const [isOutgoing, santizedTo] = useSanitizedTo(to, isExternal);

    return (
      <>
        {isOutgoing ? (
          <a
            {...(openOutgoingAsBlank ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            {...props}
            ref={ref}
            href={santizedTo as string}
            className={`isomorphic-link isomorphic-link--external ${isomorphicClassName(className)}`}
            style={isomorphicStyle(style)}
          >
            {typeof children === 'function' ? children({ isActive: false }) : children}
          </a>
        ) : (
          <NavLink
            prefetch={defaultPrefetch}
            {...props}
            ref={ref}
            to={santizedTo}
            className={({ isActive }) =>
              `isomorphic-link isomorphic-link--internal ${isomorphicClassName(className, isActive)}`
            }
            style={style}
            replace={replace}
            state={state}
            reloadDocument={reloadDocument}
            caseSensitive={caseSensitive}
            end={end}
          >
            {children}
          </NavLink>
        )}
      </>
    );
  },
);

IsomorphicLink.displayName = 'IsomorphicLink';

export { IsomorphicLink, useIsomorphicNavigate, IsomorphicNavProvider, isomorphicClassName, isomorphicStyle };

export type { IsomorphicLinkProps, IsomorphicNavContextProps, IsomorphicNavigateFunction };

export default IsomorphicLink;
