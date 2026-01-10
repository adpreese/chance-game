const fallbackItems = [
  'Australia',
  'Norway',
  'Egypt',
  'Mongolia',
  'Japan',
  'Peru',
  'Jamaica',
  'Latvia',
  'Madagascar'
];

const STORAGE_KEY = 'chance-game-items';

const storageAvailable = () => typeof window !== 'undefined' && Boolean(window.localStorage);

const normalizeItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => String(item).trim()).filter(Boolean);
};

const safeParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const loadStoredState = () => {
  if (!storageAvailable()) {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  const parsed = safeParse(raw);
  const storedItems = normalizeItems(parsed?.items ?? parsed);
  const storedOriginalItems = normalizeItems(parsed?.originalItems ?? storedItems);
  if (!storedItems.length && !storedOriginalItems.length) {
    return null;
  }
  return {
    items: storedItems,
    originalItems: storedOriginalItems.length ? storedOriginalItems : storedItems,
  };
};

const storedState = loadStoredState();

const state = {
  items: storedState ? [...storedState.items] : [...fallbackItems],
  originalItems: storedState ? [...storedState.originalItems] : [...fallbackItems],
  removeOnSelect: false,
  nextGame: 'random',
  shader: 'none',
};

const parseItems = (raw) => {
  if (!raw) {
    return [];
  }
  return raw
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const persistItems = () => {
  if (!storageAvailable()) {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      items: state.items,
      originalItems: state.originalItems,
    }),
  );
};

const setItemsFromText = (raw) => {
  const parsed = parseItems(raw);
  state.items = parsed.length ? parsed : [...fallbackItems];
  state.originalItems = [...state.items];
  persistItems();
};

const setRemoveOnSelect = (value) => {
  state.removeOnSelect = Boolean(value);
};

const setNextGame = (value) => {
  state.nextGame = value;
};

const setShader = (value) => {
  state.shader = value;
};

const resetItemsIfEmpty = () => {
  if (!state.items.length) {
    state.items = [...state.originalItems];
    persistItems();
  }
};

const consumeItem = (choice) => {
  if (!state.removeOnSelect) {
    return choice;
  }
  state.items = state.items.filter((item) => item !== choice);
  persistItems();
  resetItemsIfEmpty();
  return choice;
};

const getNextItem = () => {
  resetItemsIfEmpty();
  const choice = state.items[Math.floor(Math.random() * state.items.length)];
  return consumeItem(choice);
};

const getItems = () => {
  resetItemsIfEmpty();
  return [...state.items];
};

const getState = () => ({ ...state, items: getItems() });

export {
  consumeItem,
  fallbackItems,
  getItems,
  getNextItem,
  getState,
  parseItems,
  setItemsFromText,
  setNextGame,
  setRemoveOnSelect,
  setShader,
};
