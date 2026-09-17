// Normalizes a raw `?view=` query value to one of the three supported
// modes, defaulting to 'combined' for anything unrecognized.
export function resolveView(rawView) {
  if (rawView === 'regular' || rawView === 'playoff') return rawView;
  return 'combined';
}

// Returns a SQL boolean expression to filter season_totals rows by the
// resolved view. 'combined' means "no filter" — sum both regular and
// playoff rows together, which is the existing default behavior this
// whole app was built around.
export function gameTypeCondition(view, alias = 's') {
  if (view === 'regular') return `${alias}.game_type = 'regular'`;
  if (view === 'playoff') return `${alias}.game_type = 'playoff'`;
  return 'TRUE';
}
