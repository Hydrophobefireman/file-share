from typing import Optional, Union
from datetime import timedelta, timezone, datetime
from http.cookies import SimpleCookie
import time

_weekdayname = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
_monthname = [
    None,  # Dummy so we can use 1-based month numbers
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]


def format_date_time(timestamp):
    year, month, day, hh, mm, ss, wd, _y, _z = time.gmtime(timestamp)
    return "%s, %02d %3s %4d %02d:%02d:%02d GMT" % (
        _weekdayname[wd],
        day,
        _monthname[month],
        year,
        hh,
        mm,
        ss,
    )


def create_cookie(
    key: str,
    value: str = "",
    max_age: Optional[Union[int, timedelta]] = None,
    expires: Optional[Union[int, float, datetime]] = None,
    path: str = "/",
    domain: Optional[str] = None,
    secure: bool = False,
    httponly: bool = False,
    SameSite: str = "None",
) -> SimpleCookie:
    """Create a Cookie given the options set

    The arguments are the standard cookie morsels and this is a
    wrapper around the stdlib SimpleCookie code.
    """
    cookie = SimpleCookie()  # type: ignore
    cookie[key] = value
    cookie[key]["path"] = path
    cookie[key]["httponly"] = httponly  # type: ignore
    cookie[key]["secure"] = secure  # type: ignore
    if isinstance(max_age, timedelta):
        cookie[key]["max-age"] = f"{max_age.total_seconds():d}"  # type: ignore
    if isinstance(max_age, int):
        cookie[key]["max-age"] = str(max_age)
    if expires is not None and isinstance(expires, (int, float)):
        cookie[key]["expires"] = format_date_time(int(expires))
    elif expires is not None and isinstance(expires, datetime):
        cookie[key]["expires"] = format_date_time(
            expires.replace(tzinfo=timezone.utc).timestamp()
        )
    # if SameSite:
    #     cookie[key]["SameSite"] = SameSite
    if domain is not None:
        cookie[key]["domain"] = domain
    output = cookie.output(header="")
    if SameSite:
        output += f"; SameSite={SameSite}"
    return output
