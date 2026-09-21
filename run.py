import os
import sys

# Ensure immediate unbuffered logging for cloud container environments (Render, Railway, Fly.io)
os.environ["PYTHONUNBUFFERED"] = "1"

# Ensure repository root is on sys.path
root_dir = os.path.dirname(os.path.abspath(__file__))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

import uvicorn

if __name__ == "__main__":
    # Render assigns dynamic port via $PORT (defaults to 10000 on Render, 8000 locally)
    port_env = os.environ.get("PORT", "10000")
    try:
        port = int(port_env)
    except (ValueError, TypeError):
        port = 10000

    host = "0.0.0.0"
    print(f"==================================================", flush=True)
    print(f"🚀 NeuroTraffic C4ISR Backend Starting", flush=True)
    print(f"   Binding Host: {host}", flush=True)
    print(f"   Binding Port: {port}", flush=True)
    print(f"   Python:       {sys.version.split()[0]}", flush=True)
    print(f"==================================================", flush=True)

    uvicorn.run(
        "backend.app.main:app",
        host=host,
        port=port,
        log_level="info",
        access_log=True
    )
