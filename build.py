import os
import subprocess
import sys
import shutil
import json

cd = os.getcwd()
build_dir = os.path.join(cd, "docs")

if __name__ == "__main__":
    if os.path.isdir(build_dir):
        shutil.rmtree(build_dir)
    pr = subprocess.Popen(["npm", "run", "build"])
    pr.wait()
    print("adding CNAME")
    with open(os.path.join(build_dir, "CNAME"), "w") as f:
        f.write("files.pycode.tk")
    # print("copying service worker")
    # name = "firebase-messaging-sw.js"
    # shutil.copyfile(os.path.join(os.getcwd(), name), os.path.join(build_dir, name))
    files = [
        i
        for i in os.listdir(build_dir)
        if os.path.splitext(i)[1] == ".json" and "manifest" in i
    ]
    if len(files):
        _file = os.path.join(build_dir, files[0])
        with open(_file) as ff:
            data = json.load(ff)
        with open(_file, "w") as ff:
            json.dump(data, ff)
