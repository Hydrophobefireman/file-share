import { $, makeCSS } from "./router/utils.js";
import MatSpinner from "./custom-elements/matspinner.js";
export const ProdMode = () => location.hostname !== "localhost";
export const _URLHOST = window.location.host.includes("localhost")
  ? "localhost:5000"
  : "file-share-rtc.herokuapp.com";
export function nextEvent(target, name) {
  return new Promise(resolve => {
    target.addEventListener(name, resolve, { once: true });
  });
}
export const URLBASE = `${window.location.protocol}//${_URLHOST}`;
export const encodeID = e => {
  try {
    return btoa(JSON.stringify(e));
  } catch (e) {
    console.warn(e);
    return null;
  }
};
export const decodeID = e => {
  try {
    return JSON.parse(atob(e));
  } catch (e) {
    console.warn(e);
    return null;
  }
};
export const localWebsocketURL = a =>
  `${
    "https:" === window.location.protocol ? "wss://" : "ws://"
  }${_URLHOST}/${a}`;
export default class Requests {
  static async get(a, b = !0, c = {}) {
    let d;
    return (
      (d = b ? URLBASE + a : a),
      await fetch(d, { headers: c, credentials: "include" })
    );
  }
  static async post(
    a,
    b = !0,
    c,
    d = { "content-type": "application/x-www-form-urlencoded" }
  ) {
    let e;
    return (
      (e = b ? URLBASE + a : a),
      await fetch(e, {
        method: "post",
        body: c,
        headers: d,
        credentials: "include"
      })
    );
  }
}
export async function getConnection(router, st) {
  const _makeRequest = async (st = true) => {
    router.stopSubsequentRenders = false;
    $.empty(router.root);
    router.root.appendChild(
      new MatSpinner(
        null,
        null,
        makeCSS({
          margin: "auto",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        })
      )
    );
    router.root.appendChild(
      (() => {
        const div = $.create("div", {
          style: "margin:auto;text-align:center"
        });
        div.textContent = "Connecting to the server";
        return div;
      })()
    );
    await Requests.get("/api/gen_204");
    setTimeout(() => (st ? router.startLoad() : void 0), 450);
  };
  const connErrComponent = router => ({
    element: "div",
    status: 503,
    textContent:
      "An error occured while contacting the server..please reload the page and try again",
    attrs: {
      style: {
        margin: "auto",
        "text-align": "center"
      },
      class: "_errComponent"
    },
    children: [
      {
        element: "button",
        attrs: {
          style: {
            background: "#fff",
            color: "#000",
            border: "1px solid #6f70ee",
            "border-radius": "20px",
            display: "block",
            margin: "auto",
            "margin-top": "20px",
            padding: "8px",
            width: "20%",
            outline: "none",
            cursor: "pointer"
          },
          class: "ripple"
        },
        textContent: "Reload",
        events: {
          click() {
            return getConnection(router);
          }
        }
      }
    ]
  });
  const _getConnOnError = (e, router) => {
    console.log(e);
    return (
      router.registerRoute(connErrComponent(router), !0),
      setTimeout(
        () => (router.pushStatus(503), (router.stopSubsequentRenders = true)),
        500
      )
    );
  };
  return retry(() => _makeRequest(st), 2, e => _getConnOnError(e, router));
}

export const retry = async (func, rCount, onerror) => {
  let d;
  for (let e = 0; e < rCount; e++) {
    try {
      return await func();
    } catch (f) {
      d = f;
    }
    await (() =>
      new Promise(resolve => {
        setTimeout(() => resolve(), 100);
      }))();
  }
  onerror(d);
};
