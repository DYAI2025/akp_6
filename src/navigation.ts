import { pages, type PageId, type Project } from './siteData';

const pageIds = new Set<PageId>(pages.map((page) => page.id));

export function getPageByHash(hash: string): PageId | null {
  const normalizedHash = hash.trim().replace(/^#/, '');
  return pageIds.has(normalizedHash as PageId) ? (normalizedHash as PageId) : null;
}

export function filterProjects(allProjects: Project[], selectedFilter: string): Project[] {
  if (selectedFilter === 'alle') {
    return allProjects;
  }

  const normalizedFilter = selectedFilter.toLocaleLowerCase('de-DE');
  return allProjects.filter((project) => {
    const normalizedCategory = project.category.toLocaleLowerCase('de-DE');
    const normalizedTags = project.tags.map((tag) => tag.toLocaleLowerCase('de-DE'));
    return normalizedCategory === normalizedFilter || normalizedTags.includes(normalizedFilter);
  });
}

export function shouldDelegateWheelToScrollable(event: WheelEvent, root: HTMLElement): boolean {
  const target = event.target instanceof Element ? event.target : null;
  const scrollable = target?.closest('[data-scrollable="true"]');

  if (!(scrollable instanceof HTMLElement) || !root.contains(scrollable)) {
    return false;
  }

  const canScrollVertically = scrollable.scrollHeight > scrollable.clientHeight;
  const canScrollHorizontally = scrollable.scrollWidth > scrollable.clientWidth;
  if (!canScrollVertically && !canScrollHorizontally) {
    return false;
  }

  const scrollingDown = event.deltaY > 0;
  const scrollingUp = event.deltaY < 0;
  const scrollingRight = event.deltaX > 0;
  const scrollingLeft = event.deltaX < 0;

  const canScrollDown = scrollable.scrollTop + scrollable.clientHeight < scrollable.scrollHeight;
  const canScrollUp = scrollable.scrollTop > 0;
  const canScrollRight = scrollable.scrollLeft + scrollable.clientWidth < scrollable.scrollWidth;
  const canScrollLeft = scrollable.scrollLeft > 0;

  return (
    (scrollingDown && canScrollDown) ||
    (scrollingUp && canScrollUp) ||
    (scrollingRight && canScrollRight) ||
    (scrollingLeft && canScrollLeft)
  );
}
