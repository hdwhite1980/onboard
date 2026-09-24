"""Extract the checked source archive and run the Mac development setup."""
import argparse,hashlib,json,os,pathlib,platform,shutil,stat,subprocess,sys,zipfile

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

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--destination',type=pathlib.Path,default=pathlib.Path.home()/'OnboardAI');ap.add_argument('--plan',action='store_true');ap.add_argument('--build-only',action='store_true');ap.add_argument('--proxy',default='');args=ap.parse_args()
    folder=pathlib.Path(__file__).resolve().parent;release=json.loads((folder/'source-release.json').read_text());archive=folder/release['archive']
    if archive.name!=release['archive'] or digest(archive)!=release['sha256']:raise RuntimeError('The source archive failed verification. Download the repository again.')
    if args.plan:print(json.dumps(release,indent=2));return
    if platform.system()!='Darwin' or platform.machine()!='arm64' or int(platform.mac_ver()[0].split('.')[0])<26:raise RuntimeError('This setup requires Apple silicon and macOS 26 or later. Windows and Intel Mac installers are not available.')
    if not shutil.which('cargo'):raise RuntimeError('Install the official Rust toolchain first; see INSTALL.md.')
    subprocess.run(['/usr/bin/xcrun','--find','swiftc'],check=True,stdout=subprocess.DEVNULL)
    if not args.build_only and (pathlib.Path.home()/'Applications/Onboard AI.app').exists():raise RuntimeError('An Onboard app is already installed. Use --build-only to prepare a separate build without replacing it.')
    destination=args.destination.expanduser().absolute()
    if len(str(destination/'product/integrated/state/native.sock').encode())>103:raise RuntimeError('Choose a shorter destination, such as ~/OnboardAI.')
    if shutil.disk_usage(pathlib.Path.home()).free<6*1024**3:raise RuntimeError('At least 6 GiB free disk space is required.')
    os.umask(0o077);extract(archive,destination)
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
