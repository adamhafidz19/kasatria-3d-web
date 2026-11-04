export const MAX_TILES = 200;

export const NET_WORTH_THRESHOLDS = {
  HIGH: 200000,
  MEDIUM: 100000,
};

export const NET_WORTH_TIERS = {
  low: { label: '< $100K', className: 'tier-low' },
  medium: { label: '> $100K', className: 'tier-medium' },
  high: { label: '> $200K', className: 'tier-high' },
};

export const LAYOUT = {
  TABLE: {
    COLS: 20,
    ROWS: 10,
    X_SPACING: 140,
    Y_SPACING: 180,
  },
  SPHERE: {
    RADIUS: 1000,
  },
  HELIX: {
    RADIUS: 1400,
    ANGLE_STEP: 0.2,
    Y_STEP: 30,
    Y_OFFSET: 1485,
  },
  GRID: {
    X: 5,
    Y: 4,
    Z: 10,
    X_SPACING: 380,
    Y_SPACING: 350,
    Z_SPACING: 400,
  },
};

export const CAMERA = {
  FOV: 40,
  NEAR: 1,
  FAR: 20000,
  INITIAL_Z: 3000,
  MIN_DISTANCE: 300,
  MAX_DISTANCE: 9000,
  FRAMES: {
    table: {
      position: [0, 0, 3000],
      target: [0, 0, 0],
    },
    sphere: {
      position: [0, 0, 3000],
      target: [0, 0, 0],
    },
    helix: {
      position: [2600, 1300, 4700],
      target: [0, 0, 0],
    },
    grid: {
      position: [2300, 1400, 4100],
      target: [0, 0, 0],
    },
  },
};

export const ANIMATION = {
  DEFAULT_DURATION: 2000,
};
