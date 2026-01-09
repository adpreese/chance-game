const fallbackItems = [
  'Nova',
  'Aurora',
  'Orbit',
  'Comet',
  'Zenith',
  'Pulse',
  'Echo',
  'Nimbus',
];

const state = {
  items: [...fallbackItems],
  originalItems: [...fallbackItems],
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

const setItemsFromText = (raw) => {
  const parsed = parseItems(raw);
  state.items = parsed.length ? parsed : [...fallbackItems];
  state.originalItems = [...state.items];
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
  }
};

const consumeItem = (choice) => {
  if (!state.removeOnSelect) {
    return choice;
  }
  state.items = state.items.filter((item) => item !== choice);
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
