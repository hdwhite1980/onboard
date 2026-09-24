#!/bin/bash
# Start with macOS built-ins: Python itself may need Apple's developer tools.
set -eu
cd "$(dirname "$0")"

# Help and plan must never open an installer or require developer tools.
for argument in "$@"; do
    case "$argument" in
        --plan)
            echo 'Plan: Apple silicon / macOS 26+; install missing Apple developer tools and Rust, then verify source, download pinned model/runtime, build and install Onboard AI.'
            echo 'Apple installation requires approval in its system dialog. No changes made by --plan.'
            cat source-release.json
            exit 0 ;;
        --help|-h)
            echo 'Usage: bash Setup.command [--plan] [--build-only] [--destination FOLDER] [--proxy URL] [--cache-root PREVIOUS_FOLDER]'
            echo 'Installs missing prerequisites, then downloads and builds Onboard AI. See INSTALL.md.'
            exit 0 ;;
    esac
done
if [ "$(uname -s)" != Darwin ] || [ "$(uname -m)" != arm64 ]; then
    echo 'Setup requires an Apple-silicon Mac running macOS 26 or later.' >&2
    exit 1
fi
onboard_version=$(/usr/bin/sw_vers -productVersion)
if [ "${onboard_version%%.*}" -lt 26 ]; then
    echo 'This pinned runtime requires macOS 26 or later.' >&2
    exit 1
fi
apple_tools_ready() {
    /usr/bin/xcode-select -p >/dev/null 2>&1 &&
    /usr/bin/xcrun --find swiftc >/dev/null 2>&1 &&
    /usr/bin/python3 -c 'import ssl, zipfile' >/dev/null 2>&1
}
if ! apple_tools_ready; then
    echo 'Opening Apple developer-tools installation. Complete the Apple dialog, then return here.'
    /usr/bin/xcode-select --install || true
    if [ ! -t 0 ]; then
        echo 'Finish the Apple installation, then run bash Setup.command again in Terminal.' >&2
        exit 1
    fi
    read -r -p 'When Apple finishes installing, press Return to continue (Control-C to stop): ' onboard_ready
    if ! apple_tools_ready; then
        echo 'Apple tools are not ready. Complete installation or resolve the Xcode selection/license, then run this script again.' >&2
        exit 1
    fi
fi
exec /usr/bin/python3 -B setup.py "$@"
