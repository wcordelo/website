import { expect, test } from 'bun:test';
import { createMemoryRouter } from 'react-router-dom';

test('replacing an active section URL creates a new location key for scrolling', async () => {
  const router = createMemoryRouter([{ path: '/contact', element: null }], { initialEntries: ['/contact#get-in-touch'] });
  const firstKey = router.state.location.key;
  await router.navigate('/contact#get-in-touch', { replace: true });
  expect(router.state.location.hash).toBe('#get-in-touch');
  expect(router.state.location.key).not.toBe(firstKey);
  router.dispose();
});
