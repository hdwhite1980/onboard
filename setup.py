"""Extract the checked source archive and run the Mac development setup."""
import argparse,datetime,hashlib,json,os,pathlib,platform,re,shutil,stat,subprocess,sys,tempfile,urllib.parse,urllib.request,zipfile

def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for data in iter(lambda:f.read(1024*1024),b''):h.update(data)
    return h.hexdigest()

def extract(source,destination):
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
        previous={}
        marker=destination/'SOURCE-INVENTORY.json'
        if destination.exists():
            if not marker.is_file() or marker.is_symlink():raise RuntimeError('This folder is not a managed Onboard installation. Choose its original installation folder with --destination.')
            previous={row['path']:row for row in json.loads(marker.read_text())['files']}
        # Validate every existing target before changing anything; retain local modifications.
        for member in z.infolist():
            target=destination/member.filename
            if target.is_symlink() or not target.resolve().is_relative_to(destination.resolve()):raise RuntimeError('Source target escapes installation folder')
            if target.exists() and member.filename!='SOURCE-INVENTORY.json':
                current=digest(target);new=hashlib.sha256(z.read(member)).hexdigest()
                if current!=new and current!=previous.get(member.filename,{}).get('sha256'):
                    raise RuntimeError('Locally modified source kept intact: '+member.filename)
        destination.mkdir(parents=True,exist_ok=True,mode=0o700)
        backup=None
        for member in z.infolist():
            target=destination/member.filename;data=z.read(member)
            if target.exists() and target.read_bytes()==data:continue
            if target.exists():
                if backup is None:
                    backup=destination/'setup-history'/datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
                old=backup/member.filename;old.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(target,old)
            target.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
            fd,temporary=tempfile.mkstemp(prefix='.onboard-source-',dir=target.parent)
            try:
                with os.fdopen(fd,'wb') as output:output.write(data)
                os.chmod(temporary,0o700 if (member.external_attr>>16)&0o111 else 0o600)
                os.replace(temporary,target)
            finally:
                if os.path.exists(temporary):os.unlink(temporary)

def installation_destination(explicit=None,home=None):
    home=home or pathlib.Path.home()
    if explicit:return explicit.expanduser().absolute()
    installed=home/'Applications/Onboard AI.app/Contents/Resources/local.json'
    if installed.is_file():
        root=json.loads(installed.read_text()).get('root','')
        if root and (pathlib.Path(root)/'SOURCE-INVENTORY.json').is_file():return pathlib.Path(root).resolve()
        raise RuntimeError('Installed app uses a development checkout, not a managed setup folder. Use --destination for a managed installation; the checkout is preserved.')
    for candidate in (home/'OnboardAI',home/'OnboardAIFixed'):
        if (candidate/'SOURCE-INVENTORY.json').is_file():return candidate
    return home/'OnboardAI'

def prepare_update(destination,archive=None):
    if not destination.exists():return
    app=pathlib.Path.home()/'Applications/Onboard AI.app/Contents/MacOS/OnboardAI'
    settings=app.parents[1]/'Resources/local.json'
    matching=app.is_file() and settings.is_file() and pathlib.Path(json.loads(settings.read_text()).get('root','')).resolve()==destination.resolve()
    if not matching and archive is None:
        import fcntl
        lock=destination/'product/integrated/state/service.lock'
        if lock.exists():
            with lock.open('r') as handle:
                try:fcntl.flock(handle,fcntl.LOCK_EX|fcntl.LOCK_NB)
                except BlockingIOError:raise RuntimeError('This installation has a running service. Stop it in AI Settings and retry setup.')
        return
    # Do not replace code while the UI or its local worker may be using it.
    running=subprocess.run(['/usr/bin/pgrep','-x','OnboardAI'],capture_output=True,text=True)
    if running.returncode==0:
        if not sys.stdin.isatty():raise RuntimeError('Quit Onboard AI, then rerun Setup.command. Existing files will be reused.')
        input('Quit Onboard AI (Command-Q), then press Return to update using existing files: ')
        if subprocess.run(['/usr/bin/pgrep','-x','OnboardAI'],capture_output=True).returncode==0:raise RuntimeError('Onboard AI is still open. Quit it and retry.')
    # The installed executable authenticates its own service shutdown.
    app=pathlib.Path.home()/'Applications/Onboard AI.app/Contents/MacOS/OnboardAI'
    settings=app.parents[1]/'Resources/local.json'
    if app.is_file() and settings.is_file() and pathlib.Path(json.loads(settings.read_text()).get('root','')).resolve()==destination.resolve():
        stopped=subprocess.run([str(app),'--stop-service'],capture_output=True,text=True,timeout=60)
        if archive is None and stopped.returncode and 'Local service is stopped' not in stopped.stderr:
            raise RuntimeError('Could not stop the existing Onboard service. Existing files have not been updated.')
        if archive is not None:
            stop_previous_from_archive(archive,destination);return
        import time
        socket=destination/'product/integrated/state/native.sock'
        for _ in range(100):
            if not socket.exists():break
            time.sleep(.1)
        else:raise RuntimeError('The old service is still shutting down. Retry setup after it stops.')
    if archive is not None:stop_previous_from_archive(archive,destination)

def stop_previous_from_archive(archive,destination):
    # main verified the release ZIP; check its helper against the inventory before execution.
    name='product/integrated/service/service_control.py'
    with zipfile.ZipFile(archive) as z:
        data=z.read(name);row=next(x for x in json.loads(z.read('SOURCE-INVENTORY.json'))['files'] if x['path']==name)
        if hashlib.sha256(data).hexdigest()!=row['sha256'] or len(data)!=row['bytes']:raise RuntimeError('Service control helper failed source verification.')
    with tempfile.TemporaryDirectory(prefix='onboard-update-control-') as folder:
        helper=pathlib.Path(folder)/'service_control.py';helper.write_bytes(data)
        result=subprocess.run([sys.executable,'-I','-B',str(helper),'--state',str(destination/'product/integrated/state')],capture_output=True,text=True,timeout=40)
        if result.returncode:raise RuntimeError(result.stderr.strip() or 'Could not stop the old Onboard service; existing files are unchanged.')

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
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--destination',type=pathlib.Path);ap.add_argument('--plan',action='store_true');ap.add_argument('--build-only',action='store_true');ap.add_argument('--proxy',default='');ap.add_argument('--cache-root',type=pathlib.Path);args=ap.parse_args()
    folder=pathlib.Path(__file__).resolve().parent;release=json.loads((folder/'source-release.json').read_text());archive=folder/release['archive']
    if archive.name!=release['archive'] or digest(archive)!=release['sha256']:raise RuntimeError('The source archive failed verification. Download the repository again.')
    if args.plan:print(json.dumps(release,indent=2));return
    if platform.system()!='Darwin' or platform.machine()!='arm64' or int(platform.mac_ver()[0].split('.')[0])<26:raise RuntimeError('This setup requires Apple silicon and macOS 26 or later. Windows and Intel Mac installers are not available.')
    subprocess.run(['/usr/bin/xcrun','--find','swiftc'],check=True,stdout=subprocess.DEVNULL)
    destination=installation_destination(args.destination)
    print("Using installation folder: "+str(destination),flush=True)
    if len(str(destination/'product/integrated/state/native.sock').encode())>103:raise RuntimeError('Choose a shorter destination, such as ~/OnboardAI.')
    if shutil.disk_usage(pathlib.Path.home()).free<2*1024**3:raise RuntimeError('At least 2 GiB free disk space is required for update/build staging; missing downloads need additional space.')
    os.umask(0o077)
    ensure_rust(configure_network(args.proxy))
    prepare_update(destination,archive)
    extract(archive,destination)
    print('Source verified. Reusing verified installed assets, downloading missing files, and updating the development app.',flush=True)
    command=[sys.executable,'-B',str(destination/'product/integrated/tools/setup_local.py'),'setup']
    if args.cache_root:command+=['--cache-root',str(args.cache_root.expanduser().resolve())]
    if args.proxy:command+=['--proxy',args.proxy]
    if not args.build_only:command+=['--install']
    subprocess.run(command,check=True,env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1'))
    print('Keep '+str(destination)+' in place: the development app uses its local runtime and model.')

if __name__=='__main__':
    try:main()
    except (Exception,KeyboardInterrupt) as error:
        print('Setup stopped: '+str(error),file=sys.stderr);sys.exit(1)
