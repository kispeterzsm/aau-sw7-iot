

# Building images without docker:

Install buildkit
```bash
VERSION=$(curl -s https://api.github.com/repos/moby/buildkit/releases/latest | grep tag_name | cut -d '"' -f 4)
curl -LO https://github.com/moby/buildkit/releases/download/${VERSION}/buildkit-${VERSION}.linux-amd64.tar.gz
sudo tar -C /usr/local -xzvf buildkit-${VERSION}.linux-amd64.tar.gz
```
Run Buidkit
```bash
sudo buildkitd &
```

Save image from nerdctl in tar file
```bash
nerdctl save frontend:latest -o frontend.tar
```

Export file image to local kubernetes registry
```bash
sudo ctr -n k8s.io images import frontend.tar
```