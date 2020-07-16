import { getElement, load } from "../router/utils";
import { matInput } from "../elements.js";
import requests, { encodeID } from "../ext.js";
import { _random } from "../router/utils.js";
const DEFAULT_DEVICE_ID = `${navigator.platform}-${navigator.product}-${_random(
  5
)}`;
const deviceName = {
  element: "div",
  onrender() {
    const inp = getElement(this, "deviceID");
    const el = getElement(this, "deviceID-ph");
    el.attrs.class.add("moveup");
    inp.attrs.value = DEFAULT_DEVICE_ID;
    inp.reRender();
    el.reRender();
  },
  children: [
    "Type Your Device Name",
    matInput("deviceID-ph", "Device Name", "deviceID")
  ]
};
function showMessage(message, $Thisarg) {
  const el = getElement($Thisarg, "notif");
  el.$$element.style.transform = "translate(0px,0px)";
  el.$$element.textContent = message;
  return setTimeout(() => el.reRender(), 2000);
}

async function validateID(val, that) {
  const spinner = getElement(that, "$spinner");
  spinner.add();
  const req = await requests.post(
    "/api/validate-id/",
    true,
    JSON.stringify({ sess_id: val }),
    {
      "content-type": "application/json"
    }
  );
  return await req.json();
}
async function joinExistingSession({ keyCode }) {
  const $val = this.attrs.value || "";
  const val = $val.trim();
  if (val && keyCode === 13) {
    const idx = await validateID(val, this);
    if (idx.type === "unique") {
      showMessage("No Session exists with the given ID", this);
    } else {
      const device_id = getElement(this, "deviceID").attrs.value;
      const data = await requests.post(
        "/api/get-id/",
        true,
        JSON.stringify({
          sess_id: val,
          device_id,
          default_token: DEFAULT_DEVICE_ID
        }),
        { "content-type": "application/json" }
      );
      const resp = await data.json();
      let preferred;
      const { init_conn } = resp;
      if (init_conn.length - 1) {
        preferred = await getPreferredUser();
      } else {
        preferred = init_conn[0];
      }
      if (resp.type === "no_id") {
        return showMessage(
          "An error occured while connecting..please start a new session",
          this
        );
      } else {
        const toLoad = encodeID({ id: val, device_id, preferred });
        if (toLoad) {
          return load(`/session?${toLoad}`);
        }
      }
    }
    return getElement(this, "$spinner").remove();
  }
}
async function startNewSession({ keyCode }) {
  const $val = this.attrs.value || "";
  const val = $val.trim();
  if (val && keyCode === 13) {
    const idx = await validateID(val, this);
    if (idx.type === "unique") {
      const device_id = getElement(this, "deviceID").attrs.value;
      const data = await requests.post(
        "/api/set-id/",
        true,
        JSON.stringify({
          sess_id: val,
          device_id,
          default_token: DEFAULT_DEVICE_ID
        }),
        {
          "content-type": "application/json"
        }
      );
      const resp = await data.json();
      if (resp.type === "init_connection") {
        const toLoad = encodeID({ id: val, device_id });
        if (toLoad) {
          return load(`/session?${toLoad}`);
        }
      } else {
        showMessage("Invalid Data", this);
      }
    } else {
      showMessage("A Session already exists with that name", this);
    }
    return getElement(this, "$spinner").remove();
  }
}

const startSessButton = {
  idx: "startsessbtn",
  element: "button",
  attrs: {
    style: {
      "border-radius": "5px",
      margin: "10px"
    },
    class: ["ripple", "actionbtn"]
  },
  children: ["Start a Session"],
  events: {
    click() {
      const c = getElement(this, "joinSessBox"),
        d = getElement(this, "startSessBox");
      c.remove();
      d.add("");
    }
  }
};
const joinSessButton = {
  idx: "joinsessbtn",
  element: "button",
  attrs: {
    style: {
      "border-radius": "5px",
      margin: "10px"
    },
    class: ["ripple", "actionbtn"]
  },
  children: ["Join a Session"],
  events: {
    click() {
      const c = getElement(this, "joinSessBox"),
        d = getElement(this, "startSessBox");
      c.add("");
      d.remove();
    }
  }
};
const joinSessBox = {
  idx: "joinSessBox",
  onrender() {
    this.remove();
  },
  element: "div",
  children: [
    { element: "div", children: ["Type a session name to join"] },
    matInput("joinID-ph", "Session ID", "joinID", {
      keydown: joinExistingSession
    })
  ]
};
console.log(
  matInput("startID-ph", "Session ID", "startID", {
    keydown: startNewSession
  })
);
const startSessBox = {
  onrender() {
    this.remove();
  },
  children: [
    {
      element: "div",
      children: [
        "Type a session name to start. Others will find your device with this name"
      ]
    },
    matInput("startID-ph", "Session ID", "startID", {
      keydown: startNewSession
    })
  ],
  idx: "startSessBox",
  element: "div"
};
export default {
  route: "/",
  element: "div",
  attrs: {},
  children: [
    {
      element: "div",
      idx: "notif",
      attrs: { notification: "" }
    },
    deviceName,
    startSessButton,
    joinSessButton,
    joinSessBox,
    startSessBox,
    {
      element: "mat-spinner",
      idx: "$spinner",
      onrender() {
        this.remove();
      },
      attrs: { svgstyle: "margin:auto;display:block" }
    }
  ]
};
