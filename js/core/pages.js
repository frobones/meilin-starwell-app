/**
 * Page Registry
 * The single list of pages: routing, the passkey gate, and screen reader
 * announcements all read it. Each id matches a `#<id>-page` element in
 * index.html and a loader in main.js.
 */

export const DEFAULT_PAGE = 'rumors';

/** @type {{ id: string, title: string, protected: boolean }[]} */
export const PAGES = [
    { id: 'rumors', title: 'Rumors', protected: false },
    { id: 'overview', title: 'Character Overview', protected: true },
    { id: 'dmsummary', title: 'DM Summary', protected: true },
    { id: 'dmtools', title: 'DM Tools', protected: true },
    { id: 'medicine', title: 'Herbal Medicine', protected: false },
    { id: 'novelette', title: 'Novelette', protected: true },
    { id: 'vignettes', title: 'Vignettes', protected: true }
];

/**
 * Look up a page by id
 * @param {string} id - Page id, as used in the URL hash
 * @returns {{ id: string, title: string, protected: boolean } | undefined}
 */
export function getPage(id) {
    return PAGES.find(page => page.id === id);
}
