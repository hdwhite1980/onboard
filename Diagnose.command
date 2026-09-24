#!/bin/bash
# Read-only process inspection; does not install, start, stop, or download anything.
set -eu
cd "$(dirname "$0")"
/usr/bin/python3 -I -B ./setup.py --diagnose-service "$@"
