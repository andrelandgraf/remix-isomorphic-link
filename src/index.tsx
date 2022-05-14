import type { FC, PropsWithChildren, CSSProperties } from 'react';
import React, { useCallback, useContext, useMemo } from 'react';
import type { NavLinkProps, NavigateOptions, To } from 'react-router-dom';
import { NavLink, useNavigate } from 'react-router-dom';

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
  throw new Error(`react-router-isomorphic-link: ${message}`);
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
  const fakeUrl = `https://react-router-isomorphic-link.com${isAbsolute ? sanitizedHref : `/${sanitizedHref}`}`;
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
  useFinalSlash = false,
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
    const sanitizedPath = useFinalSlash ? addFinalSlash(href.pathname) : href.pathname;
    return [false, sanitizedPath + href.search + href.hash];
  }
  const { pathname, search, hash } = to;
  const sanitizedPathname = useFinalSlash && pathname ? addFinalSlash(pathname) : pathname;
  return [false, { pathname: sanitizedPathname, search, hash }];
}

function useSanitizedTo(to: To, explicitlyOutgoing?: boolean): [isExternal: boolean, to: To] {
  const { host, useFinalSlash } = useContext(NavigationContext);
  return useMemo(
    () => sanitizeTo(to, useFinalSlash, explicitlyOutgoing, host),
    [to, useFinalSlash, explicitlyOutgoing, host],
  );
}

interface NavigationContextProps {
  host: string | undefined;
  useFinalSlash: boolean | undefined;
}

/**
 * Provides further context for the IsomorphicLink component.
 * host: The host of your app, such as "example.com" or "localhost:8888"
 */
const NavigationContext = React.createContext<NavigationContextProps>({
  host: undefined,
  useFinalSlash: false,
});

const NavigationContextProvider: FC<PropsWithChildren<NavigationContextProps>> = ({ children, ...props }) => {
  return <NavigationContext.Provider value={props}>{children}</NavigationContext.Provider>;
};

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
  const { host, useFinalSlash } = useContext(NavigationContext);
  const navigate = useNavigate();
  const isomorphicNavigate: IsomorphicNavigateFunction = useCallback(
    (to, options?, props?) => {
      const [isExternal, sanitizedTo] = sanitizeTo(to, useFinalSlash, props?.isExternal, host);
      if (isExternal) {
        window.location.href = sanitizedTo as string;
      } else {
        navigate(sanitizedTo, options);
      }
    },
    [navigate, host, useFinalSlash],
  );
  return isomorphicNavigate;
};

/**
 * The isomorphic link component
 * - Same interface as the React Router NavLink component.
 * - Wrap this component with the NavigationContextProvider to provider further configuration options.
 * - Explicitly force render as anchor tag by passing isExternal={true}
 */
const IsomorphicLink = React.forwardRef<HTMLAnchorElement, IsomorphicLinkProps>(
  ({ to, isExternal, className, style, children, ...props }, ref) => {
    const [isOutgoing, santizedTo] = useSanitizedTo(to, isExternal);

    return (
      <>
        {isOutgoing ? (
          <a
            {...props}
            ref={ref}
            href={santizedTo as string}
            className={`isomorphic-link--external ${isomorphicClassName(className)}`}
            style={isomorphicStyle(style)}
          >
            {children}
          </a>
        ) : (
          <NavLink
            {...props}
            ref={ref}
            to={santizedTo}
            className={`isomorphic-link--internal ${className}`}
            style={style}
          >
            {children}
          </NavLink>
        )}
      </>
    );
  },
);

IsomorphicLink.displayName = 'IsomorphicLink';

export { IsomorphicLink, useIsomorphicNavigate, NavigationContextProvider };

export type { IsomorphicLinkProps, NavigationContextProps, IsomorphicNavigateFunction };

export default IsomorphicLink;
