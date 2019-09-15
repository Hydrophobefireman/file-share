export const isKeyValObj = a => a.constructor === Object;
export const trace = (a, b = "warn") => {
  console[b](`[logger]--->${a}`);
};
export const load = hash => {
  if ("string" == typeof hash)
    return "/" === hash[0]
      ? (location.hash = hash)
      : (location.hash = `/${hash}`);
};
export const Events = new class Events {
  emit(type, detail) {
    return window.dispatchEvent(new CustomEvent(type, { detail }));
  }
  listen(type, listener) {
    this.EventCache[type] = listener;
    return window.addEventListener(type, listener);
  }
  detroyEvt(type, listener) {
    window.removeEventListener(type, listener);
  }
  destroyAll() {
    for (const event of Object.keys(this.EventCache)) {
      this.detroyEvt(event, this.EventCache[event]);
    }
  }
  constructor() {
    this.EventCache = {};
  }
}();
export const parseHash = (route = window.location) => {
  let url, url2;
  if ("#" === route[0]) url = route.substr(1);
  else
    try {
      (url2 = new URL(route)), (url = url2.hash.substr(1));
    } catch (n) {
      (url = "/"), console.log(n);
    }
  const d = url.split("?"),
    [l, m] = [0 === url.length ? "/" : d[0], d[1]];
  return { path: l, qs: m };
};
export const noop = () => {};
export const asyncNoop = async () => {};
export const __random__ = (a = 15) => {
  return [...Array(a)]
    .map(() => (~~(16 * Math.random())).toString(16))
    .join("");
};
export const _random = (a = 15) =>
  [...Array(a)]
    .join(".")
    .replace(/[.]/g, b =>
      (
        b ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (b / 4)))
      ).toString(16)
    );
const _s = (() => {
  const a = document.createElement("style");
  return (a.innerHTML = ""), document.head.appendChild(a), a.sheet;
})();
export const sheet = _s;
const _getRules = (a, b = sheet) => {
  const c = Array.from(b.rules);
  return c.filter(d => d.selectorText === a)[0];
};

export const setattrs = (element, attributes, stylesheet = sheet) => {
  const attrs = Object.keys(attributes);
  for (const key of attrs) {
    if (!["$$element", "$$parent"].includes(key)) {
      const value = attributes[key];
      if (key === "class") {
        if (typeof value === "string") {
          element.className = value;
        } else {
          element.className = [...value].join(" ");
        }
      } else if (key === "events") {
        for (const event of Object.keys(value)) {
          const listener = value[event];
          element.addEventListener(event, listener);
        }
      } else if (key === "style") {
        let csstext, inserNewRule, selector;
        if (isKeyValObj(value)) {
          csstext = makeCSS(value);
        } else {
          csstext = value;
        }
        selector =
          element.getAttribute("_routercontent") || attributes._routercontent;
        if (selector) {
          const sheetRule = _getRules(`[_routercontent="${selector}"]`);
          if (sheetRule) {
            sheetRule.style = csstext;
          } else {
            inserNewRule = true;
          }
        } else {
          selector = _random();
          inserNewRule = true;
        }
        if (inserNewRule) {
          element.setAttribute("_routercontent", selector);
          stylesheet.insertRule(`[_routercontent='${selector}']{${csstext}}`);
        }
      } else if (
        ["___innerHTML___", "innerText", "textContent"].includes(key)
      ) {
        if (key === "___innerHTML___") {
          element.innerHTML = value;
        } else {
          element.textContent = value;
        }
      } else {
        element.setAttribute(key, value);
      }
    }
  }
};
export const $ = {
  q(a, b = !0) {
    return b
      ? document.querySelector(a)
      : Array.from(document.querySelectorAll(a));
  },
  id: a => document.getElementById(a),
  className(a, b = !0) {
    const c = Array.from(document.getElementsByClassName(a));
    return b ? c[0] : c;
  },
  /**
   *
   * @returns {HTMLElement}
   */
  create(a, b, c = sheet) {
    const d = document.createElement(a);
    return b && "object" == typeof b && setattrs(d, b, c), d;
  },
  get: (a, b) => a.getAttribute(b),
  set: (a, b, c) => a.setAttribute(b, c),
  empty: a => {
    let b;
    for (b = a.lastChild; b; ) a.removeChild(b), (b = a.lastChild);
  }
};
export const isFunction = a => a instanceof Function;
export const isAsync = a => "AsyncFunction" === a.constructor.name;
export const changeCSS = (a, b, c = !1) => {
  let d;
  const e = _getRules(a);
  if (!e) return sheet.insertRule(`${a}{${b}}`);
  if (c) return (e.style = makeCSS(b));
  d = makeObjectFromCss(b);
  for (const f of Object.keys(d)) e.style[f] = d[f];
};
export const makeCSS = a => {
  if ("string" == typeof a) return a;
  const b = [];
  for (const c of Object.keys(a)) b.push(`${c}:${a[c]}`);
  return b.join(";");
};
export const makeObjectFromCss = a => {
  if ("object" == typeof a) return a;
  const b = a.split(";");
  return b.reduce((c, d) => {
    const e = d.split(":"),
      f = {};
    return 1 < e.length
      ? ((f[e[0].trim()] = e[1].trim()), Object.assign(c, f))
      : c;
  }, {});
};
export const urlencode = a => {
  if (window.URLSearchParams) {
    return new URLSearchParams(a);
  } else {
    return `${Object.keys(a)
      .map(b => `${encodeURIComponent(b)}=${encodeURIComponent(a[b])}`)
      .join("&")}`;
  }
};
function isSameDay(c, d) {
  return (
    c.getFullYear() === d.getFullYear() &&
    c.getMonth() === d.getMonth() &&
    c.getDate() === d.getDate()
  );
}
export const stampFormat = c => {
  try {
    const d = { hour: "numeric", hour12: !0, minute: "numeric" },
      e = new Date(c),
      f = new Date();
    if (
      (e.getFullYear() !== f.getFullYear() && (d.year = "numeric"),
      isSameDay(e, f) || (d.month = d.day = "numeric"),
      e.getMonth())
    )
      return Intl.DateTimeFormat("auto", d).format(e);
  } catch (d) {
    return console.log(d), new Date(c).toLocaleString();
  }
};
export const _getTime = () => new Date().getTime();
export const aptSize = a => {
  const b = 0 | (a / 1048576);
  if (b) return `${b} MB`;
  const c = 0 | (a / 1024);
  return c ? `${c} KB` : `${a} b`;
};
export const makeComponent = (
  element,
  attrs = {},
  beforeRender = () => {},
  onrender = () => {},
  textContent = null,
  events = {},
  children = [],
  route = null,
  selector,
  onUnmount = () => {},
  idx = null
) => ({
  element,
  attrs,
  beforeRender,
  onrender,
  textContent,
  events,
  children,
  selector,
  route,
  onUnmount,
  idx
});
export const getElement = (a, b) => {
  if (a) {
    const c = a.routeCache();
    if (c) {
      return c[b];
    }
    return null;
  }
  return null;
};

export function safeDefine(name, cls) {
  if (!window.customElements.get(name)) {
    return window.customElements.define(name, cls);
  }
}

$.q("noscript").remove();
