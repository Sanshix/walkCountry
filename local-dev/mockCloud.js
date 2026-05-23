const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'mock-db.json');
let currentOpenid = process.env.MOCK_OPENID || 'mock_openid_001';

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      routes: {},
      spots: {},
      sessions: {},
      notes: {},
      oauthStates: {},
      users: {},
      external_identities: {}
    }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function genId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function getValue(obj, key) {
  return obj[key];
}

function matches(doc, query) {
  return Object.entries(query || {}).every(([key, cond]) => {
    const value = getValue(doc, key);
    if (cond && typeof cond === 'object' && cond.__op === 'in') {
      return cond.values.includes(value);
    }
    if (Array.isArray(value) && typeof cond !== 'object') {
      return value.includes(cond);
    }
    return value === cond;
  });
}

function applyUpdate(target, data) {
  for (const [key, value] of Object.entries(data || {})) {
    if (value && typeof value === 'object' && value.__op === 'addToSet') {
      if (!Array.isArray(target[key])) target[key] = [];
      if (!target[key].includes(value.value)) target[key].push(value.value);
    } else if (value && typeof value === 'object' && value.__op === 'push') {
      if (!Array.isArray(target[key])) target[key] = [];
      target[key].push(value.value);
    } else {
      target[key] = value;
    }
  }
}

class DocRef {
  constructor(name, id) {
    this.name = name;
    this.id = id;
  }

  async get() {
    const db = readDb();
    const col = db[this.name] || {};
    return { data: col[this.id] ? clone(col[this.id]) : null };
  }

  async set({ data }) {
    const db = readDb();
    db[this.name] = db[this.name] || {};
    db[this.name][this.id] = { ...clone(data), _id: this.id };
    writeDb(db);
    return { _id: this.id };
  }

  async update({ data }) {
    const db = readDb();
    db[this.name] = db[this.name] || {};
    if (!db[this.name][this.id]) {
      throw new Error(`document ${this.name}/${this.id} not found`);
    }
    applyUpdate(db[this.name][this.id], data);
    writeDb(db);
    return { updated: 1 };
  }
}

class Query {
  constructor(name, query = {}) {
    this.name = name;
    this.query = query;
    this.limitCount = null;
  }

  limit(n) {
    this.limitCount = n;
    return this;
  }

  async get() {
    const db = readDb();
    const col = db[this.name] || {};
    let data = Object.values(col).filter((doc) => matches(doc, this.query));
    if (this.limitCount !== null) data = data.slice(0, this.limitCount);
    return { data: clone(data) };
  }
}

class Collection {
  constructor(name) {
    this.name = name;
  }

  doc(id) {
    return new DocRef(this.name, id);
  }

  where(query) {
    return new Query(this.name, query);
  }

  limit(n) {
    return new Query(this.name, {}).limit(n);
  }

  async get() {
    const db = readDb();
    const col = db[this.name] || {};
    return { data: clone(Object.values(col)) };
  }

  async add({ data }) {
    const db = readDb();
    db[this.name] = db[this.name] || {};
    const id = data._id || genId(this.name);
    if (db[this.name][id]) {
      throw new Error(`duplicate document ${this.name}/${id}`);
    }
    db[this.name][id] = { ...clone(data), _id: id };
    writeDb(db);
    return { _id: id, id };
  }
}

const command = {
  in(values) {
    return { __op: 'in', values };
  },
  addToSet(value) {
    return { __op: 'addToSet', value };
  },
  push(value) {
    return { __op: 'push', value };
  }
};

const mockCloud = {
  DYNAMIC_CURRENT_ENV: 'local-dev',
  init() {},
  database() {
    return {
      command,
      collection(name) {
        return new Collection(name);
      },
      serverDate() {
        return new Date().toISOString();
      }
    };
  },
  getWXContext() {
    return { OPENID: currentOpenid };
  },
  __setOpenId(openid) {
    currentOpenid = openid;
  },
  __dbPath: DB_PATH,
  __readDb: readDb,
  __writeDb: writeDb
};

module.exports = mockCloud;
