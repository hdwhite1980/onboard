"""Verify a prepared/downloaded release without installing tools or reading account state."""
import ast,hashlib,json,pathlib,sys,zipfile

def verify(root):
    manifest=json.loads((root/'source-release.json').read_text())
    raw=(root/manifest['archive']).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=manifest['sha256']:raise ValueError('Source archive checksum mismatch')
    for line in (root/'SHA256SUMS.txt').read_text().splitlines():
        digest,name=line.split('  ',1);path=pathlib.PurePosixPath(name)
        if path.is_absolute() or '..' in path.parts:raise ValueError('Unsafe checksum path')
        if hashlib.sha256((root/name).read_bytes()).hexdigest()!=digest:raise ValueError('Release checksum mismatch: '+name)
    with zipfile.ZipFile(root/manifest['archive']) as archive:
        entries=archive.namelist()
        if len(entries)!=len(set(entries)):raise ValueError('Duplicate source entries')
        inventory=json.loads(archive.read('SOURCE-INVENTORY.json'))
        expected={r['path'] for r in inventory['files']}|{'SOURCE-INVENTORY.json'}
        if set(entries)!=expected:raise ValueError('Source inventory does not match archive')
        for row in inventory['files']:
            path=pathlib.PurePosixPath(row['path'])
            if path.is_absolute() or '..' in path.parts or any(x in path.parts for x in ('state','.git','node_modules')) or ('.artifacts' in path.parts and not (str(path)=='product/local_ai/.artifacts/build/resource-probe' and row['sha256']=='b50d9c70b1ce3520248d78ec08ad2ad7d9729a94b364f87529f8161095f4a564')) or path.name.startswith('.env'):raise ValueError('Unapproved source entry: '+str(path))
            data=archive.read(row['path'])
            if hashlib.sha256(data).hexdigest()!=row['sha256'] or len(data)!=row['bytes']:raise ValueError('Source file mismatch: '+str(path))
            if path.suffix=='.py':ast.parse(data,filename=str(path))
    print('Release checksums, exact source inventory, safe paths and Python syntax verified. No live integration was exercised.')
if __name__=='__main__':verify(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve())
