"""Extract the checked source archive and run the Mac development setup."""
import argparse,hashlib,json,os,pathlib,platform,re,shutil,stat,subprocess,sys,tempfile,urllib.parse,urllib.request,zipfile

def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for data in iter(lambda:f.read(1024*1024),b''):h.update(data)
    return h.hexdigest()

def extract(source,destination):
    if destination.exists():raise RuntimeError('Destination already exists. Keep it intact and choose a new --destination folder.')
    with zipfile.ZipFile(source) as z:
        seen=set()
        for member in z.infolist():
            path=pathlib.PurePosixPath(member.filename)
            if path.is_absolute() or '..' in path.parts or '\\' in member.filename or member.filename in seen or stat.S_ISLNK(member.external_attr>>16):
                raise RuntimeError('Unsafe source archive member')
            seen.add(member.filename)
        inventory=json.loads(z.read('SOURCE-INVENTORY.json'))['files']
        if seen!={x['path'] for x in inventory}|{'SOURCE-INVENTORY.json'}:raise RuntimeError('Source archive inventory does not match')
        for row in inventory:
            data=z.read(row['path'])
            if len(data)!=row['bytes'] or hashlib.sha256(data).hexdigest()!=row['sha256']:raise RuntimeError('Source file checksum mismatch: '+row['path'])
        destination.mkdir(parents=True,mode=0o700)
        for member in z.infolist():
            target=destination/member.filename;target.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
            target.write_bytes(z.read(member));target.chmod(0o700 if (member.external_attr>>16)&0o111 else 0o600)

def configure_network(explicit_proxy=''):
    """Use an explicit or manual proxy; never silently bypass PAC/WPAD."""
    system = subprocess.run(['/usr/sbin/scutil', '--proxy'], check=True, capture_output=True, text=True).stdout
    if not explicit_proxy and re.search(r'(ProxyAutoConfigEnable|ProxyAutoDiscoveryEnable)\s*:\s*1', system):
        raise RuntimeError('Automatic proxy (PAC/WPAD) is enabled. Ask IT for an approved explicit proxy and use --proxy URL.')
    proxies = {'http': explicit_proxy, 'https': explicit_proxy} if explicit_proxy else urllib.request.getproxies()
    for scheme in ('http', 'https'):
        value = proxies.get(scheme)
        if not value:continue
        parsed = urllib.parse.urlsplit(value)
        if parsed.scheme not in ('http','https') or not parsed.hostname or parsed.username or parsed.password or parsed.path not in ('','/') or parsed.query or parsed.fragment:
            raise RuntimeError('Use an HTTP(S) proxy URL without credentials, path, query or fragment.')
        try:parsed.port
        except ValueError:raise RuntimeError('Invalid proxy port.')
        os.environ[scheme+'_proxy'] = os.environ[scheme.upper()+'_PROXY'] = value
    if explicit_proxy:
        os.environ.pop('no_proxy',None);os.environ.pop('NO_PROXY',None)
    if proxies.get('https'):os.environ['CARGO_HTTP_PROXY'] = proxies['https']
    return urllib.request.build_opener(urllib.request.ProxyHandler(proxies), SecureRedirect())

class SecureRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if urllib.parse.urlsplit(newurl).scheme != 'https':
            raise RuntimeError('Refusing a non-HTTPS installer redirect.')
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def rust_ready():
    for name in ('cargo','rustc'):
        binary=shutil.which(name)
        if not binary or subprocess.run([binary,'--version'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:
            return False
    return True

def ensure_rust(opener):
    # Find a previous rustup install immediately, including in a newly opened shell.
    cargo_bin=pathlib.Path(os.environ.get('CARGO_HOME',str(pathlib.Path.home()/'.cargo')))/'bin'
    if cargo_bin.is_dir():os.environ['PATH']=str(cargo_bin)+os.pathsep+os.environ.get('PATH','')
    if rust_ready():
        print('Rust is ready; keeping the existing toolchain.',flush=True)
        return
    print('Installing the official Rust stable toolchain (minimal profile).',flush=True)
    # Keep rustup on official publishers even if a shell has mirror overrides.
    env=dict(os.environ,RUSTUP_DIST_SERVER='https://static.rust-lang.org',RUSTUP_UPDATE_ROOT='https://static.rust-lang.org/rustup')
    with tempfile.TemporaryDirectory(prefix='onboard-rust-') as temporary:
        installer=pathlib.Path(temporary)/'rustup-init.sh'
        try:
            with opener.open('https://sh.rustup.rs',timeout=60) as response:
                data=response.read(2*1024*1024+1)
            if not data.startswith(b'#!/') or len(data)>2*1024*1024:
                raise RuntimeError('Unexpected Rust installer response; a proxy may have blocked it.')
            installer.write_bytes(data)
            subprocess.run(['/bin/sh',str(installer),'-y','--profile','minimal','--default-toolchain','stable','--no-modify-path'],check=True,env=env)
        except Exception as error:
            raise RuntimeError('Rust installation failed. Check the network/proxy or installation output, then rerun Setup.command.') from error
    os.environ['PATH']=str(cargo_bin)+os.pathsep+os.environ.get('PATH','')
    if not rust_ready():raise RuntimeError('Rust did not become usable. Check the installation output before retrying.')

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--destination',type=pathlib.Path,default=pathlib.Path.home()/'OnboardAI');ap.add_argument('--plan',action='store_true');ap.add_argument('--build-only',action='store_true');ap.add_argument('--proxy',default='');args=ap.parse_args()
    folder=pathlib.Path(__file__).resolve().parent;release=json.loads((folder/'source-release.json').read_text());archive=folder/release['archive']
    if archive.name!=release['archive'] or digest(archive)!=release['sha256']:raise RuntimeError('The source archive failed verification. Download the repository again.')
    if args.plan:print(json.dumps(release,indent=2));return
    if platform.system()!='Darwin' or platform.machine()!='arm64' or int(platform.mac_ver()[0].split('.')[0])<26:raise RuntimeError('This setup requires Apple silicon and macOS 26 or later. Windows and Intel Mac installers are not available.')
    subprocess.run(['/usr/bin/xcrun','--find','swiftc'],check=True,stdout=subprocess.DEVNULL)
    if not args.build_only and (pathlib.Path.home()/'Applications/Onboard AI.app').exists():raise RuntimeError('An Onboard app is already installed. Use --build-only to prepare a separate build without replacing it.')
    destination=args.destination.expanduser().absolute()
    if len(str(destination/'product/integrated/state/native.sock').encode())>103:raise RuntimeError('Choose a shorter destination, such as ~/OnboardAI.')
    if shutil.disk_usage(pathlib.Path.home()).free<6*1024**3:raise RuntimeError('At least 6 GiB free disk space is required.')
    if destination.exists():raise RuntimeError('Destination already exists. Choose a new --destination folder; existing files are kept intact.')
    os.umask(0o077)
    ensure_rust(configure_network(args.proxy))
    extract(archive,destination)
    print('Source verified. Downloading pinned dependencies and building the development app.',flush=True)
    command=[sys.executable,'-B',str(destination/'product/integrated/tools/setup_local.py'),'setup']
    if args.proxy:command+=['--proxy',args.proxy]
    if not args.build_only:command+=['--install']
    subprocess.run(command,check=True,env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1'))
    print('Keep '+str(destination)+' in place: the development app uses its local runtime and model.')

if __name__=='__main__':
    try:main()
    except (Exception,KeyboardInterrupt) as error:
        print('Setup stopped: '+str(error),file=sys.stderr);sys.exit(1)
