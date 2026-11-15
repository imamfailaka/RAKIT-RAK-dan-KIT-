import sys, time, subprocess, os, uno
sys.path.insert(0, sys.argv[3])
from office.soffice import get_soffice_env
from com.sun.star.beans import PropertyValue
env = get_soffice_env()
prof = "file:///tmp/claude-0/lo-prof"
proc = subprocess.Popen(["soffice", "--headless", "--norestore", f"-env:UserInstallation={prof}", '--accept=socket,host=127.0.0.1,port=2002;urp;'], env=env)
ctx = uno.getComponentContext()
res = ctx.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", ctx)
for i in range(60):
    try:
        rc = res.resolve("uno:socket,host=127.0.0.1,port=2002;urp;StarOffice.ComponentContext"); break
    except Exception:
        time.sleep(1)
desk = rc.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", rc)
def pv(n, v):
    p = PropertyValue(); p.Name = n; p.Value = v; return p
doc = desk.loadComponentFromURL(uno.systemPathToFileUrl(os.path.abspath(sys.argv[1])), "_blank", 0, (pv("Hidden", True),))
idx = doc.getDocumentIndexes()
for i in range(idx.getCount()): idx.getByIndex(i).update()
doc.storeToURL(uno.systemPathToFileUrl(os.path.abspath(sys.argv[2])), (pv("FilterName", "MS Word 2007 XML"),))
doc.close(True)
try: desk.terminate()
except Exception: pass
proc.wait(timeout=30)
print("updated", idx.getCount())
