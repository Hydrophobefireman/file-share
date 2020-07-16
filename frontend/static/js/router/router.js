import {
  $,
  isFunction,
  _random,
  isAsync,
  setattrs,
  safeDefine,
  load as _load,
  parseHash as __parseHash__
} from "./utils.js";
const backEl = {
  element: "a",
  attrs: {
    href: "/#/",
    style: {
      display: "block",
      color: "#000"
    }
  },
  events: {
    click(b) {
      b.preventDefault(), (location.hash = "/");
    }
  },
  textContent: "Click Here to Go Back",
  children: []
};
const __cssrule = {
  display: "block",
  "text-align": "center",
  "font-family": "sans-serif",
  padding: "8px",
  margin: "auto",
  "font-weight": "bold"
};
export const Router = new class Router {
  parseHash(e) {
    return __parseHash__(e);
  }
  async __runConditionals() {
    const conditionalElements = [...document.querySelectorAll("[_routerif]")];
    for (const element of conditionalElements) {
      const _condition = $.get(element, "_routerif");
      const _then = $.get(element, "_routerthen");
      const condition = new Function("$", `return ${_condition}`).call(
        this,
        element
      );
      if (condition) {
        const data = element.$;
        if (data) {
          element.replaceWith(data);
        }
        if (_then) {
          new Function("$", _then).call(this, data || element);
        }
      } else {
        if (element.$ instanceof HTMLElement) {
          continue;
        }
        const ret = { _routerif: _condition };
        if (_then) {
          ret._routerthen = _then;
        }
        const el = $.create("router-data", ret);
        el.$ = element;
        element.replaceWith(el);
      }
    }
  }
  async __runEventListeners() {
    const eventElements = $.q("[_routerEvt][_routerAct]", false);
    for (const element of eventElements) {
      const event = $.get(element, "_routerEvt");
      const _listener = $.get(element, "_routerAct");
      element[event] = () => {
        new Function(_listener).call(this);
      };
    }
  }
  async _runDirectives() {
    await this.__runConditionals();
    this.__runEventListeners();
  }
  _callFuncWithThis(func, obj, el, args) {
    if (isAsync(func, args)) {
      return func.apply(obj, [args]).then(r => {
        if (el) {
          if ((r || {}).stopUpdate) {
            setattrs(el, obj.attrs);
          }
        }
        return r;
      });
    } else {
      const resp = func.apply(obj, [args]);
      if (el) {
        if (!(resp || {}).stopUpdate) {
          setattrs(el, obj.attrs);
        }
      }
      return resp;
    }
  }
  _setVars(r) {
    this.stopSubsequentRenders = false;
    this.root = r;
    this.routeMap = {};
    this.routes = [];
    this.routeCache = {};
    this.unMountFn = () => {};
    this.unmountRoute = () => {
      this.unMountFn();
      this.routeCache = {};
    };
    this.statusHandler = {
      404: {
        element: "div",
        attrs: {
          style: __cssrule
        },
        textContent: "The Page you are requesting was not found",
        children: [backEl]
      },
      500: {
        element: "div",
        attrs: {
          style: __cssrule
        },
        textContent: "An Error Occured while trying to process your request",
        children: [backEl]
      }
    };
  }
  constructor(root = window.$ROOT || $.id("app-root") || $.q("body")) {
    this._setVars(root);
    window.onhashchange = w => {
      return (this.navData = w), this.routeChange(), this._runDirectives();
    };
    this._runDirectives();
  }
  isUserGoingBack(nextRoute) {
    const navDat = this.navData || {},
      fullURL = `${location.protocol}//${location.host}/#${nextRoute}`;
    return (
      !(fullURL != navDat.oldURL) && (console.log("Same url navigation"), !0)
    );
  }
  routeParser(a) {
    const { path } = this.parseHash(a);
    return path;
  }
  load(hash) {
    return _load(hash);
  }

  lazyload(route, componentPromise, loadingComponent) {
    if (!loadingComponent) {
      this.registerRoute({
        route,
        element: "div",
        textContent: "loading",
        attrs: { style: { margin: "100px" } }
      });
    } else {
      this.registerRoute(loadingComponent);
    }
    const toLoad = this.getRouteName(this.currentRoute) === route;
    if (toLoad) {
      this.startLoad();
    }
    return componentPromise.then(mod => {
      this.registerRoute(mod.default);
      if (toLoad) {
        return this.startLoad();
      }
    });
  }
  get currentQS() {
    const { qs } = this.parseHash(location.hash);
    return qs;
  }
  get currentRoute() {
    return this.routeParser(location.href);
  }
  startLoad() {
    this.routeChange();
  }
  pushStatus(code, msg) {
    const b = this.statusHandler[code];
    b.textContent = msg || b.textContent;
    return b
      ? this.render(b, this.root, !0)
      : this.render(this.statusHandler[404]);
  }
  getRouteName(e) {
    const f = e.split("/").filter(h => h)[0];
    if (f) {
      return `/${f}/`;
    } else {
      return "/";
    }
  }
  isValidRoute(e) {
    if (this.routes.includes(e))
      return {
        res: !0,
        args: null,
        _fRoute: e
      };
    try {
      const f = e.split("/").filter(h => h),
        g = `/${f[0]}/`;
      return this.routes.includes(g)
        ? {
            res: !0,
            args: f.slice(1),
            _fRoute: g
          }
        : {
            res: !1
          };
    } catch (f) {
      return (
        console.log(f),
        {
          res: !1
        }
      );
    }
  }
  routeChange() {
    const route = this.parseHash(location.href);
    const { res, args, _fRoute } = this.isValidRoute(route.path);
    if (!res) {
      this.render(this.statusHandler["404"], this.root, true, args);
    } else {
      console.log("rendering");
      this.render(this.routeMap[_fRoute], this.root, true, {
        args,
        qs: route.qs
      });
    }
  }
  __toSets(obj) {
    if (typeof obj.attrs.class === "string") {
      obj.attrs.class = new Set([obj.attrs.class]);
    } else if (Array.isArray(obj.attrs.class)) {
      obj.attrs.class = new Set(obj.attrs.class);
    }
  }
  __objDef(obj, parent, toEmpty, routeArgs, parentAttrs) {
    const $element = () => obj.$$element;
    obj.attrs = obj.attrs || {};
    this.__toSets(obj);
    obj.getRouter = () => this;
    obj.update = () => {
      if ($element() && obj.attrs) {
        return setattrs($element(), obj.attrs);
      }
    };
    obj.remove = () => {
      if ($element().parentNode) {
        return $element().replaceWith(
          (() => {
            const a = $.create("router-data");
            obj._$routerData = a;
            return a;
          })()
        );
      }
    };
    obj.add = (css = "block") => {
      if (obj._$routerData) {
        obj._$routerData.replaceWith($element());
        obj._$routerData = undefined;
      }
      if (css) {
        $element().style.display = css;
      }
    };
    obj.routeCache = () => this.routeCache;

    obj.reRender = async (_obj = obj) => {
      obj.attrs._routercontent = $element().getAttribute("_routercontent");
      return $element().replaceWith(
        await this.render(_obj, parent, toEmpty, routeArgs, parentAttrs)
      );
    };
    obj.safeRerender = val => {
      obj.add();
      obj.reRender(val);
      obj.add();
    };
  }
  async render(obj, parent, toEmpty = false, _routerArgs, parentAttrs) {
    if (this.stopSubsequentRenders || !obj) {
      console.log("preventing render");
      return;
    }
    if (typeof obj === "string") {
      const node = document.createTextNode(obj);
      return parent.appendChild(node), node;
    }
    const routeArgs = _routerArgs || {};
    this._runDirectives();
    const {
      element,
      attrs,
      beforeRender,
      onrender,
      textContent,
      _innerHTML,
      onUnmount,
      events,
      children,
      isRoute
    } = obj;
    this.__objDef(obj, parent, toEmpty, routeArgs, parentAttrs);
    if (isRoute || toEmpty) {
      this.unmountRoute();
    }
    if (isFunction(beforeRender)) {
      let stop;
      if (isAsync(beforeRender)) {
        stop = await this._callFuncWithThis(beforeRender, obj, null, routeArgs);
      } else {
        stop = this._callFuncWithThis(beforeRender, obj, null, routeArgs);
      }
      if (stop && stop.stopExec) {
        return;
      }
    }
    const el = $.create(element, attrs);
    const _thisroutecache = {};
    if (obj.idx) {
      _thisroutecache[obj.idx] = obj;
    }
    Object.assign(this.routeCache, kvChildren(children), _thisroutecache);
    obj.$$element = el;
    obj.$$parent = parentAttrs || null;
    if (textContent || textContent === 0) {
      el.textContent = textContent;
    } else if (_innerHTML) {
      console.warn("innerHTML can be dangerous!");
      el.innerHTML = _innerHTML;
    }

    for (const b of Object.keys(events || {})) {
      el.addEventListener(b, args =>
        this._callFuncWithThis(events[b], obj, el, args)
      );
    }
    for (const c of children || []) {
      this.render(c, el, false, null, obj);
    }
    if (toEmpty) {
      $.empty(parent);
    }
    parent.appendChild(el);
    if (isRoute) {
      this.unMountFn = onUnmount || (() => {});
    }
    if (isFunction(onrender)) {
      if (isAsync(onrender)) {
        await this._callFuncWithThis(onrender, obj, el, routeArgs);
      } else {
        this._callFuncWithThis(onrender, obj, el, routeArgs);
      }
    }
    return el;
  }
  /**
   *
   * @param {Object} obj
   * @param {boolean} isStatus
   */
  registerRoute(obj, isStatus = false) {
    if ((!obj.route || !obj.element || obj.route[0] !== "/") && !isStatus) {
      throw new Error("invalid values");
    }
    if (isStatus) {
      const code = obj.status;
      this.statusHandler[code] = obj;
    } else {
      if (!this.routes.includes(obj.route)) {
        this.routes.push(obj.route);
      }
      const {
        element,
        children,
        selector,
        attrs,
        beforeRender,
        events,
        hasRouteArgs,
        onUnmount,
        onrender,
        route,
        textContent,
        _innerHTML
      } = obj;
      const idx = obj.idx;
      return (this.routeMap[route] = {
        idx,
        element,
        selector,
        beforeRender,
        onrender,
        hasRouteArgs,
        attrs,
        textContent,
        _innerHTML,
        events,
        children,
        onUnmount,
        isRoute: true
      });
    }
  }
}();

function kvChildren(a) {
  if (!a) return {};
  const b = {};
  for (const c of a) c.idx && (b[c.idx] = c);
  return b;
}

safeDefine(
  "router-data",
  class extends HTMLElement {
    constructor() {
      super();
      const a = this.attachShadow({ mode: "open" });
      a.appendChild(
        (() => {
          return Object.assign(document.createElement("style"), {
            innerHTML: ":host{display:none}"
          });
        })()
      );
    }
  }
);

export const applyCSSAsync = async a => {
  let b;
  try {
    return (
      (b = document.createElement("link")),
      (b.href = a),
      (b.rel = "stylesheet"),
      document.head.appendChild(b)
    );
  } catch (e) {
    console.log("Could not append stylesheet", e);
  }
};
