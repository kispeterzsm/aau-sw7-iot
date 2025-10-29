# Contents

- [Contents](#contents)
- [Installing](#installing)
  - [Add Docker's official GPG key:](#add-dockers-official-gpg-key)
  - [Add the repository to Apt sources:](#add-the-repository-to-apt-sources)
  - [Install kubernetes:](#install-kubernetes)
    - [Install containerd](#install-containerd)
    - [Installing and Configuring Kubernetes Packages](#installing-and-configuring-kubernetes-packages)
  - [Creating a Control Plane](#creating-a-control-plane)
  - [More nodes](#more-nodes)
  - [Start pod](#start-pod)
  - [Possible Errors](#possible-errors)
    - [Errors can occur when updating](#errors-can-occur-when-updating)
    - [If init break you can always fix and reset](#if-init-break-you-can-always-fix-and-reset)
    - [Ip problems](#ip-problems)
    - [Crictl not connecting to the cluster](#crictl-not-connecting-to-the-cluster)
    - [Kubelet starts first than containerd](#kubelet-starts-first-than-containerd)
    - [Certificates problems](#certificates-problems)


# Installing

This is a guide on how to install kubernetes on a ubuntu 24 LTS machine.
From a networking perspective, make sure that all machines have unique hostnames, MAC addresses, and IP addresses. Those IP addresses should ideally be on the same subnet, but at the very least must be set up to reach each other.

Firstly, need to install docker with:

## Add Docker's official GPG key:

```bash
sudo apt-get update # update the package list
sudo apt-get install ca-certificates curl # is a package containing a collection of public root certificates from trusted Certificate Authorities (CAs)
sudo install -m 0755 -d /etc/apt/keyrings # The 0755 permission ensures that only the root user can modify the /etc/apt/keyrings directory, while others can read and execute but not write
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc # Download the Docker GPG key
sudo chmod a+r /etc/apt/keyrings/docker.asc # Make the Docker GPG key file readable
```

## Add the repository to Apt sources:

```bash
echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null # Add the Docker repository to the apt sources list
sudo apt-get update # Update the package list
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin # Install Docker and its dependencies
sudo systemctl status docker # Check the status of the Docker service
```

## Install kubernetes:

```bash
git clone https://github.com/kubernetes/kubernetes # Clone the kubernetes repository
cd kubernetes 
make quick-release # Build the kubernetes release
```

### Install containerd 

```bash
sudo modprobe overlay # Load the overlay module
sudo modprobe br_netfilter # Load the br_netfilter module

# We need to make sure those are also loaded on reboot
cat <<EOF | sudo tee /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF

containerd also requires a few system parameters, which we can set and persist using the command 

cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF # Persist system parameters for containerd


sudo sysctl --system # Apply those settings without rebooting using the command


# Prerequisites for containerd are in place, so we can install it through apt-get:
sudo apt-get update  # Update the package list
sudo apt-get install -y containerd # Install containerd

# Containerd requires a configuration file, and we can use containerd itself to generate one with default settings

sudo mkdir -p /etc/containerd # Create the /etc/containerd directory
sudo containerd config default | sudo tee /etc/containerd/config.toml # Generate a configuration file for containerd using containerd itself

# In this file, we must set the cgroup driver for containerd to system as this is required for the kubelet

sudo nano /etc/containerd/config.toml # Open the file /etc/containerd/config.toml in a text editor as root
```

Edit containerd config to be like:

[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
  SystemdCgroup = true

```bash
sudo systemctl restart containerd # Based on our new settings, we can use systemctl to restart containerd as
```

Docker is not the main container supported application in kubernetes anymore
containerd is now ready for use, and we can move on to the Kubernetes packages.

You can confirm the status of the service using the command
```bash
sudo systemctl status containerd
```

### Installing and Configuring Kubernetes Packages

```bash
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add - # We will install packages from the Google repository, so we will need to add Google’s apt repository gpg key first

sudo bash -c 'cat <<EOF >/etc/apt/sources.list.d/kubernetes.list 
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF' # With that key in place, we can also add the Kubernetes apt repository

sudo apt-get update
apt-cache policy kubelet | head -n 20 # verify which kubelet versions are available and which one is installed
```

We can now install kubelet, kubeadm, and kubectl
```bash
sudo apt-get install -y kubelet kubeadm kubectl # This will install the latest version of kubelet kubeadm kubectl

sudo apt-mark hold kubelet kubeadm kubectl containerd # To avoid automatic updates, we mark those tools

sudo systemctl status kubelet.service # Check the status of our kubelet and our container runtime
sudo systemctl status containerd.service

sudo systemctl enable kubelet.service # Also make sure that both services are set to start when the system starts up
sudo systemctl enable containerd.servicerd
```

## Creating a Control Plane

With our container runtime and Kubernetes packages now in place, we can move on to create our Control Plane.

We start by generating a configuration file
```bash
kubeadm config print init-defaults | tee ClusterConfiguration.yaml
```

Created, it sould look like:

```yaml
apiVersion: kubeadm.k8s.io/v1beta3
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 1.2.3.4
  bindPort: 6443
nodeRegistration:
  criSocket: unix:///var/run/containerd/containerd.sock     ### here is the container type
  imagePullPolicy: IfNotPresent
  name: node
  taints: null
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta3
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns: {}
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.k8s.io
kind: ClusterConfiguration
kubernetesVersion: 1.28.0
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12
scheduler: {}
```

Inside the default Cluster configuration file, we need to change a couple of things. Some of them can be done in an automated way.
This will Set the IP endpoint for the API Server localAPIEndpoint.advertiseAddress to the IP address of our Control Plane Node.

Set the cgroup driver for the kubelet to system, which is not yet defined in this file, as the default is cgroupfs.

Define the podNetwork:
```bash
sed -i 's/  advertiseAddress: 1.2.3.4/  advertiseAddress: 172.16.94.10/' ClusterConfiguration.yaml # This command updates the advertiseAddress in Kubernetes ClusterConfiguration.yaml file, changing it from 1.2.3.4 to actual node IP (172.16.94.10)

cat <<EOF | cat >> ClusterConfiguration.yaml
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
EOF
```
It’s part of the private IP range (172.16.0.0 to 172.31.255.255).
This range is often used in internal networks, virtual machines, or cloud VPCs.

We also need to edit the kubernetesVersion in this file to match the version you installed earlier. First, confirm the installed version using the command:
```bash
kubeadm version
```

Then we should add podSubnet in networking like
```yaml
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12
  podSubnet: 10.244.0.0/16
```

Now, we’re ready to initialize our cluster using kubeadm as:
```bash
sudo kubeadm init --config=ClusterConfiguration.yaml 
```

Then To make sure that we can interact with our cluster on a non-elevated shell as well, we need to create a config file and store it in our home directory as:

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```


## More nodes

Our Control Plane is ready, but we’re not quite ready to join our nodes yet. For a node to be able to join a cluster, we need a token. The easiest way is to directly generate a join command using kubeadm as shown:
```bash
kubeadm token create --print-join-command
```
Now, we can take this command and run it on each of our desired Worker Nodes, which will then initiate the join process. Your individual join command will be different because the CA certificate is unique. The join token is a ticket valid for 24 hours, so if you want to add more nodes later, you will need to create a new token.

```bash
kubectl get nodes
```

## Start pod

```bash
kubectl apply -f <pod yaml file>

kubectl get pods
kubectl port-forward pod/nginx-test <your listen port ex 8080:80>
curl http://localhost:<listen port>
```
## Possible Errors

### Errors can occur when updating
```bash
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /" | sudo tee /etc/apt/sources.list.d/kubernetes.list

curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
```
OBS dont upgrade from this position

### If init break you can always fix and reset

If ipv4 forwarding have a problem you should: 

This is assuming you use iptables and not ipvs. Run the following script to add bridge (for IPv4 and IPv6 and IP forwarding):
``` bash
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
```

### Ip problems 

If there are ip problems check etcd and change:
```bash
sudo cat /etc/kubernetes/manifests/etcd.yaml | grep -E "image|listen|cert|peer|advertise"
```

Also, make you have swap turned off, overlay network and bridge netfilter turned on, like:
```bash
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

sudo swapoff -a # immediately turn off swap - until reboot
sudo sed -i 's|^/swap.img|#/swap.img|g' /etc/fstab # turn off swap after restart
sudo sysctl --system # reboot sysctl
```

### Crictl not connecting to the cluster

Check if the crictl works, sometimes the the ip gives is not in the ip table to be used so to change it

```bash
ip addr show
sudo ip addr add <node_ip> dev <your_ip_table>
```

Add the node IP to /etc/netplan/*.yaml
Then:

```bash
sudo netplan try
sudo netplan apply
```

### Kubelet starts first than containerd

Sometimes kubelet starts first than containerd, so do:

```bash
sudo systemctl daemon-reexec
sudo systemctl restart containerd
sudo systemctl restart kubelet
```

### Certificates problems

Try first:
```bash
rm -rf $HOME/.kube || true   # Sometimes the certificates are not deleted
mkdir -p $HOME/.kube   
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config   # Copy the certificates
sudo chown $(id -u):$(id -g) $HOME/.kube/config # Change the owner
```
