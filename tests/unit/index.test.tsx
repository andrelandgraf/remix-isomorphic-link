import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import {
  useIsomorphicNavigate,
  IsomorphicLink,
  IsomorphicNavProvider,
  IsomorphicNavContextProps,
} from '../../src/index';

import { installGlobals } from '@remix-run/node';

installGlobals();

const Wrapper: React.FC<Partial<IsomorphicNavContextProps>> = ({
  children,
  host,
  useFinalSlash = false,
  openOutgoingAsBlank = false,
  defaultPrefetch = 'none',
}) => (
  <BrowserRouter>
    <IsomorphicNavProvider
      host={host}
      useFinalSlash={useFinalSlash}
      openOutgoingAsBlank={openOutgoingAsBlank}
      defaultPrefetch={defaultPrefetch}
    >
      <Routes>
        <Route path="/" element={children} />
        <Route path="/contact">Contact Page</Route>
      </Routes>
    </IsomorphicNavProvider>
  </BrowserRouter>
);

describe('react-router-isompohic-link', () => {
  test('renders without errors and sets default props correctly', () => {
    const { container } = render(
      <Wrapper>
        <IsomorphicLink to="/contact">Link</IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    expect(aElement.href).toBe('http://localhost/contact'); // Note: http://localhost seems to be provided by the testing lib env
    expect(aElement.innerHTML).toBe('Link');
    expect(aElement.className).toContain('isomorphic-link');
    expect(aElement.className).toContain('isomorphic-link--internal');
  });
  test('renders external URL as outgoing', () => {
    const { container } = render(
      <Wrapper>
        <IsomorphicLink to="https://youtube.com">Ext Link</IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    // This is intended. In this case, we cannot know if the link is external or not.
    // We assume it is internal.
    expect(aElement.href).toBe('https://youtube.com/');
    expect(aElement.className).toContain('isomorphic-link');
    expect(aElement.className).toContain('isomorphic-link--external');
  });
  test('renders supplied className correctly for not active internal link', () => {
    const { container } = render(
      <Wrapper>
        <IsomorphicLink to="/contact" className={({ isActive }) => `all ${isActive ? 'active' : 'not-active'}`}>
          Link
        </IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    expect(aElement.className).toEqual('isomorphic-link isomorphic-link--internal all not-active');
  });
  test('renders supplied className correctly for active internal link', () => {
    const { container } = render(
      <Wrapper>
        <IsomorphicLink to="/" className={({ isActive }) => `all ${isActive ? 'active' : 'not-active'}`}>
          Link
        </IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    expect(aElement.className).toEqual('isomorphic-link isomorphic-link--internal all active');
  });
  test('renders supplied className correctly for external link', () => {
    const { container } = render(
      <Wrapper>
        <IsomorphicLink
          to="https://youtube.com"
          className={({ isActive }) => `all ${isActive ? 'active' : 'not-active'}`}
        >
          Ext Link
        </IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    expect(aElement.className).toContain('isomorphic-link');
    expect(aElement.className).toContain('isomorphic-link--external');
    expect(aElement.className).toContain('all');
    expect(aElement.className).toContain('not-active');
  });
  test('renders external non-HTTP protocols as outgoing', () => {
    const { container } = render(
      <Wrapper>
        <IsomorphicLink to="mailto:iron.man@gmail.com">Mail</IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    // This is intended. In this case, we cannot know if the link is external or not.
    // We assume it is internal.
    expect(aElement.href).toBe('mailto:iron.man@gmail.com');
    expect(aElement.className).toContain('isomorphic-link--external');
  });
  test('renders internal absolute paths as internal links', () => {
    const { container } = render(
      <Wrapper>
        <IsomorphicLink to="/contact">Absolute Path</IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    expect(aElement.href).toBe('http://localhost/contact'); // Note: http://localhost seems to be provided by the testing lib env
    expect(aElement.className).toContain('isomorphic-link--internal');
  });
  test('renders relative paths as internal links', () => {
    const { container } = render(
      <Wrapper>
        <IsomorphicLink to="contact.html">Rel Link</IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    expect(aElement.href).toBe('http://localhost/contact.html'); // Note: http://localhost seems to be provided by the testing lib env
    expect(aElement.className).toContain('isomorphic-link--internal');
  });
  test('renders any relative paths as internal links', () => {
    const { container } = render(
      <Wrapper>
        <IsomorphicLink to="youtube.com">Ext Link</IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    // This is intended. In this case, we cannot know if the link is external or not.
    // We assume it is internal.
    expect(aElement.href).toBe('http://localhost/youtube.com'); // Note: http://localhost seems to be provided by the testing lib env
    expect(aElement.className).toContain('isomorphic-link--internal');
  });
  test('renders relative paths as external links if explicitly outgoing', () => {
    const { container } = render(
      <Wrapper>
        <IsomorphicLink to="youtube.com" isExternal>
          Ext Link
        </IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    // This is intended. In this case, we cannot know if the link is external or not.
    // We assume it is internal.
    expect(aElement.href).toBe('http://localhost/youtube.com'); // Note: http://localhost seems to be provided by the testing lib env
    expect(aElement.className).toContain('isomorphic-link--external');
  });
  test('renders relative paths as external links if explicitly outgoing', () => {
    const { container } = render(
      <Wrapper>
        <IsomorphicLink to="youtube.com" isExternal>
          Ext Link
        </IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    // This is intended. In this case, we cannot know if the link is external or not.
    // We assume it is internal.
    expect(aElement.href).toBe('http://localhost/youtube.com'); // Note: http://localhost seems to be provided by the testing lib env
    expect(aElement.className).toContain('isomorphic-link--external');
  });
  test('adds final slash to internal link if prop provided', () => {
    const { container } = render(
      <Wrapper useFinalSlash={true}>
        <IsomorphicLink to="contact">Ext Link</IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    // This is intended. In this case, we cannot know if the link is external or not.
    // We assume it is internal.
    expect(aElement.href).toBe('http://localhost/contact/'); // Note: http://localhost seems to be provided by the testing lib env
    expect(aElement.className).toContain('isomorphic-link--internal');
  });
  test('opens external link in new tab if openOutgoingAsBlank set to true', () => {
    const { container } = render(
      <Wrapper openOutgoingAsBlank={true}>
        <IsomorphicLink to="https://youtube.com">Ext Link</IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    expect(aElement.href).toBe('https://youtube.com/');
    expect(aElement.className).toContain('isomorphic-link--external');
    expect(aElement.target).toEqual('_blank');
    expect(aElement.rel).toEqual('noopener noreferrer');
  });
  test('removes host if prop provided', () => {
    const { container } = render(
      <Wrapper host="mydomain.com">
        <IsomorphicLink to="https://mydomain.com/contact" isExternal>
          Ext Link
        </IsomorphicLink>
      </Wrapper>,
    );
    const aElement = container.querySelector('a');
    expect(aElement).toBeDefined();
    if (!aElement) return;
    // This is intended. In this case, we cannot know if the link is external or not.
    // We assume it is internal.
    expect(aElement.href).toBe('http://localhost/contact'); // Note: http://localhost seems to be provided by the testing lib env
    expect(aElement.className).toContain('isomorphic-link--internal');
  });
});
