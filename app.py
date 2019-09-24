import json
from functools import wraps
from secrets import token_hex

from quart import Quart, Response, redirect, request, session, websocket
from quart.sessions import SecureCookieSessionInterface
from util import create_cookie

cookie_sess = SecureCookieSessionInterface()
app = Quart(__name__)
app.secret_key = "08d24852be504fb7d0446a171ddba4228e08dd6efaa894"
app.__sockets__ = set()

DEFAULT_CONTENT_TYPE: str = "application/json"


@app.route("/")
async def redir_to_static_site():
    if "localhost" not in request.url:
        return redirect("https://files.pycode.tk/", status_code=301)
    return "test"


def collect_websocket(func):
    # https://medium.com/@pgjobnes/websockets-in-quart-f2067788d1ee
    @wraps(func)
    async def wrapper(*args, **kwargs):
        _obj = websocket._get_current_object()
        setattr(_obj, "sess_id", session["sess_id"])
        setattr(_obj, "device_id", session["device_id"])
        setattr(_obj, "u_id", session["u_id"])
        tr = []
        for i in app.__sockets__:
            if i.sess_id == session["sess_id"] and i.u_id == session["u_id"]:
                print("Multiple Socket Connections..removing previous one")
                tr.append(i)
        try:
            [app.__sockets__.remove(i) for i in tr]
        except KeyError:
            pass
        app.__sockets__.add(_obj)
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            try:
                app.__sockets__.remove(_obj)
            except KeyError:
                pass
            print(f"Removing {_obj.sess_id}")
            raise e

    return wrapper


def get_peer_socket(peer_id: str, u_id: str = None, multiple: bool = False):
    a = [i for i in app.__sockets__ if i.sess_id == peer_id and i.u_id != u_id]
    print(a)
    if a:
        if multiple:
            return a
        return a[0]
    return None


class WebsocketResponder:
    def __init__(self, ws_obj: websocket) -> None:
        self.socket = ws_obj

    def parse_json_or_none(self, msg: str) -> dict:
        try:
            return json.loads(msg)
        except:
            return None

    async def _send_string(self, data: str, peer=None) -> None:
        socket_obj = peer or self.socket
        if not socket_obj:
            return
        return await socket_obj.send(data)

    async def send(self, data: dict, peer=None) -> None:
        unpck = json.dumps(data)
        return await self._send_string(unpck, peer)

    async def create_response(self):
        message: str = await self.socket.receive()
        self.msg: dict = self.parse_json_or_none(message)
        _type: str = self.msg.get("type")
        if _type == "ping":
            return await self.send({"type": "pong"})
        if _type == "pong":
            return await self.send({"type": "ping"})
        data: dict = self.msg.get("data")
        sess_id: str = data.get("sess_id")
        peer_socket: websocket = get_peer_socket(sess_id, session["u_id"])
        if _type == "init":
            if peer_socket:
                # since the user just connected we will request
                # the peer to destroy his previous connection if any and
                # connect to the new one .. and
                # we will  pick one of them to be the offerer

                await self.send(
                    {
                        "type": "conn_data",
                        "data": {
                            "peer": True,
                            "peer_device": session["device_id"],
                            "is_offerer": True,
                        },
                    },
                    peer_socket,
                )
            return await self.send(
                {
                    "type": "conn_data",
                    "data": {
                        "peer": bool(peer_socket),
                        "is_offerer": False,
                        "peer_device": (peer_socket.device_id if peer_socket else None),
                    },
                }
            )
        if _type == "get_role":
            is_offerer = data.get("is_offerer")
            _offer: bool = bool(is_offerer)

            await self.send({"type": "set_role", "data": {"is_offerer": _offer}})
            return await self.send(
                {"type": "set_role", "data": {"is_offerer": not _offer}}, peer_socket
            )
        if _type == "rtc_data":
            return await self.send({"type": "rtc_data", "data": data}, peer_socket)


@app.websocket("/socket-conn/")
@collect_websocket
async def main_socket():
    ws = WebsocketResponder(websocket)
    while 1:
        await ws.create_response()


@app.route("/api/set-id/", methods=["POST"])
async def set_socket_id():
    _session = dict(session)
    print(_session)
    data: dict = await request.get_json()
    sess_id: str = data.get("sess_id")
    device_id: str = data.get(
        "device_id", f"device-id-{data.get('default_token')}-{token_hex(5)}"
    )
    _session["sess_id"] = sess_id
    _session["device_id"] = device_id
    return _response({"type": "init_connection", "sess_id": sess_id}, cookies=_session)


@app.route("/api/validate-id/", methods=["POST"])
async def validate_socket_id():
    _session = dict(session)
    data: dict = await request.get_json()
    sess_id: str = data.get("sess_id")
    _session["u_id"] = token_hex(15)
    peer = get_peer_socket(sess_id, _session["u_id"])
    if peer:
        return _response({"type": "existing_connection"})
    return _response({"type": "unique"}, cookies=_session)


@app.route("/api/verify/", methods=["POST"])
async def verify_session():
    if not session.get("device_id") or not session.get("sess_id"):
        return _response(({"error": True}))
    data = await request.get_json()
    if session["sess_id"] != data.get("sess_id"):
        return _response(({"error": True}))
    return _response({"success": True})


@app.route("/api/get-id/", methods=["POST"])
async def get_socket_id():
    _session = dict(session)
    data: dict = await request.get_json()
    device_id: str = data.get(
        "device_id", f"device-id-{data.get('default_token')}-{token_hex(5)}"
    )
    _session["device_id"] = device_id
    sess_id: str = data.get("sess_id")
    _session["sess_id"] = sess_id
    peer = get_peer_socket(sess_id, _session["u_id"], True)
    if not peer:
        return _response({"type": "no_id"})
    init_conn: list = []
    init_conn.extend(i.device_id for i in peer)
    return _response({"init_conn": init_conn}, cookies=_session)


def _response(
    jsobj: dict,
    headers: dict = {"content-type": DEFAULT_CONTENT_TYPE},
    code: int = 200,
    cookies=None,
) -> Response:
    resp = Response(json.dumps(jsobj), headers=headers, status=code)
    if cookies:
        data = create_cookie(
            "session",
            cookie_sess.get_signing_serializer(app).dumps(dict(cookies)),
            httponly=True,
            path="/",
            secure=True,
            SameSite="None",
        )
        resp.headers.add("Set-Cookie", data)
    return resp


@app.route("/api/gen_204/", strict_slashes=False)
async def api_app_wake_up():
    # __import__("time").sleep(2000)
    return Response("", status=204)


@app.after_request
async def resp_headers(resp: Response):
    if "localhost" in request.headers.get("origin", ""):
        resp.headers["access-control-allow-origin"] = request.headers["origin"]
    else:
        resp.headers["access-control-allow-origin"] = "https://files.pycode.tk"
    resp.headers["Access-Control-Allow-Headers"] = request.headers.get(
        "Access-Control-Request-Headers", "*"
    )
    resp.headers["access-control-allow-credentials"] = "true"
    return resp


@app.errorhandler(500)
async def handle500(error):
    print(error)
    return Response(
        json.dumps({"error": "An unknown error occured on our end.."}),
        content_type="application/json",
    )


@app.before_serving
def open_to_nginx():
    try:
        open("/tmp/app-initialized", "w").close()
    except:
        pass


if __name__ == "__main__":
    app.run(host="0.0.0.0", use_reloader=True)
