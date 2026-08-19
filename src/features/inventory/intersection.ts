/**
 * Shared IntersectionObserver plumbing for the inventory grid.
 *
 * Two things in this page watch the viewport — card images, and the sentinel
 * that appends the next batch of cards. Both would otherwise construct an
 * observer per element, which for 200 cards means 200 observers. One observer
 * per distinct rootMargin watches every target instead, which is what the API
 * is designed for.
 *
 * Not in `src/hooks/` yet: only this page uses it. It moves when a second one
 * does.
 */
type Callback = () => void;

const callbacks = new Map<Element, Callback>();
const observers = new Map<string, IntersectionObserver>();

function handle(
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver,
): void {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;

    const onVisible = callbacks.get(entry.target);
    callbacks.delete(entry.target);
    observer.unobserve(entry.target);
    onVisible?.();
  }
}

function getObserver(rootMargin: string): IntersectionObserver {
  let observer = observers.get(rootMargin);

  if (!observer) {
    observer = new IntersectionObserver(handle, { rootMargin });
    observers.set(rootMargin, observer);
  }

  return observer;
}

export function supportsIntersectionObserver(): boolean {
  return typeof IntersectionObserver !== 'undefined';
}

/**
 * Calls `onVisible` the first time the element enters the viewport, then stops
 * watching it. Callers that need to fire again re-run this — the sentinel does
 * exactly that each time its cursor moves.
 *
 * Returns a cleanup function.
 */
export function observeOnce(
  element: Element,
  rootMargin: string,
  onVisible: Callback,
): () => void {
  callbacks.set(element, onVisible);
  getObserver(rootMargin).observe(element);

  return () => {
    callbacks.delete(element);
    getObserver(rootMargin).unobserve(element);
  };
}

