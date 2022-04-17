import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import {
  useIsomorphicNavigate,
  IsomorphicLink,
  NavigationContextProvider,
  NavigationContextProps,
} from '../../src/index';

const Wrapper: React.FC<Partial<NavigationContextProps>> = ({ children, host, useFinalSlash = false }) => (
  <BrowserRouter>
    <NavigationContextProvider host={host} useFinalSlash={useFinalSlash}>
      {children}
      <Routes>
        <Route path="/">Home Page</Route>
        <Route path="/contact">Contact Page</Route>
      </Routes>
    </NavigationContextProvider>
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
    expect(aElement.className).toContain('isomorphic-link--external');
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
