import { Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

/**
 * Debounces a signal by the given time (ms) and returns a new debounced signal.
 *
 * @param source - The source signal to debounce.
 * @param delay - Debounce delay in milliseconds.
 * @param initialValue - Initial value for the debounced signal.
 */
export function useDebouncedSignal<T>(
  source: Signal<T>,
  delay = 300,
  initialValue: T
): Signal<T> {
  const debounced$ = toObservable(source).pipe(debounceTime(delay));
  return toSignal(debounced$, { initialValue });
}
