# Kubernetes (Kubeadm) Master Setup Guide for WSL2 with Tailscale

This guide explains how to configure a Kubernetes master node using `kubeadm` inside WSL2, including network configuration, container runtime setup, GPU support, and why Tailscale is used in this environment.

---

## Why Tailscale?

WSL2 does not provide a stable, fixed IP address. Each reboot or WSL session restart may change the internal network address. Kubernetes requires a consistent, reachable IP for the API server and cluster communication. Using the Windows host address causes instability, and using WSL2’s dynamic internal IP breaks `kubeadm`.

Tailscale solves this by:

- Providing a **stable, static VPN IP** (e.g., `100.x.y.z`) that never changes.
- Allowing **secure access to the Kubernetes API server** from any device on your Tailnet.
- Bypassing WSL2 network isolation issues, making the master node reachable across reboots.
- Avoiding the need for port forwarding or exposing the API server directly on Windows.

---

# Kubernetes (Kubeadm) Master Setup Guide for WSL2 + Tailscale

## Prerequisites
1. WSL2 installed (Ubuntu 22.04 recommended).
2. Tailscale installed and connected.
3. Docker Desktop mounts disabled (required so Kubelet does not crash from mounted NTFS paths).

---

## Step 1: Prepare the Environment (Swap & Hostname)

### 1. Disable Swap
```bash
sudo sed -i '/swap/s/^/#/' /etc/fstab
sudo swapoff -a
```

### 2. Set Hostname
```bash
sudo hostnamectl set-hostname "k8s-master"
exec bash
```

### 3. Get Your Tailscale IPGet Your Tailscale IP
```bash
tailscale ip -4
```

### 4. Update /etc/hosts
```bash
sudo nano /etc/hosts
```

add the following line:
100.x.x.x k8s-master

## Step 2: Kernel Modules and Sysctl Configuration
### Load Required Kernel Modules

```bash
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter
```

### Enable Network Forwarding
```bash
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sudo sysctl --system
```

## Step 3: Install Container Runtime (Docker + Containerd)
```bash
sudo apt update
sudo apt install -y docker.io containerd
```

### Enable Systemd Cgroups
```bash
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl restart containerd
```

## Step 4: Install Kubernetes Tools
### Install Dependencies
```bash
sudo apt install -y apt-transport-https ca-certificates curl
```

### Install Dependencies
```bash
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key \
    | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-archive-keyring.gpg
```

### Add Repo
```bash
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-archive-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /" \
    | sudo tee /etc/apt/sources.list.d/kubernetes.list
```

### Install Kubernetes
```bash
sudo apt update
sudo apt install -y kubeadm kubelet kubectl
sudo apt-mark hold kubeadm kubelet kubectl
```

## Step 5: Fix WSL2 Mount Issue (Critical)
### Docker Desktop causes /mnt/wsl mounts that break Kubelet.
```bash
sudo umount /Docker/host
grep " " /proc/mounts | grep "Docker"
sudo systemctl restart kubelet
```

## Step 6: Initialize the Kubernetes Cluster
### Replace with your Tailscale IP:
```bash
sudo kubeadm init \
  --pod-network-cidr=10.10.0.0/16 \
  --apiserver-advertise-address=100.x.x.x \
  --control-plane-endpoint=100.x.x.x
```

## Step 7: Configure Local User Access
```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## Step 8: Install Calico Network Plugin
```bash
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/tigera-operator.yaml

curl -O https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/custom-resources.yaml
sed -i 's/cidr: 192\.168\.0\.0\/16/cidr: 10.10.0.0\/16/' custom-resources.yaml

kubectl create -f custom-resources.yaml
kubectl get nodes
```

---

# Complete Guide: Kubernetes GPU Setup and Testing (WSL2 + Kubeadm)

## Step 1: Configure Containerd for NVIDIA Runtime
```bash
sudo tee /etc/containerd/config.toml > /dev/null <<EOF
version = 2
[plugins]
  [plugins."io.containerd.grpc.v1.cri"]
    [plugins."io.containerd.grpc.v1.cri".containerd]
      default_runtime_name = "nvidia"
      [plugins."io.containerd.grpc.v1.cri".containerd.runtimes]
        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
          runtime_type = "io.containerd.runc.v2"
          [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
            SystemdCgroup = true

        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.nvidia]
          privileged_without_host_devices = false
          runtime_engine = ""
          runtime_root = ""
          runtime_type = "io.containerd.runc.v2"
          [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.nvidia.options]
            BinaryName = "/usr/bin/nvidia-container-runtime"
            SystemdCgroup = true
EOF

sudo systemctl restart containerd
```

## Step 2: Direct GPU Test with Containerd
### Pull
```bash
sudo ctr images pull docker.io/library/ubuntu:22.04
```

### Run
```bash
sudo ctr run --rm --gpus 0 \
  --runtime io.containerd.runc.v2 \
  --runc-binary /usr/bin/nvidia-container-runtime \
  docker.io/library/ubuntu:22.04 gpu-check-clean nvidia-smi
```

## Step 3: Allow Workloads on the Master Node
```bash
kubectl taint nodes k8s-master node-role.kubernetes.io/control-plane:NoSchedule-
```

## Step 4: Install NVIDIA Device Plugin
```bash
kubectl delete daemonset nvidia-device-plugin-daemonset -n kube-system
kubectl create -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.17.0/deployments/static/nvidia-device-plugin.yml
kubectl get pods -n kube-system -l name=nvidia-device-plugin-ds
```

## Step 5: Verify Kubernetes GPU Capacity
```bash
kubectl describe node k8s-master | grep "nvidia.com/gpu"
```

expected output:
nvidia.com/gpu: 1


## Step 6: Test GPU Pod in Kubernetes
### Create:
```bash
cat <<EOF > gpu-test-fast.yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-test-fast
spec:
  restartPolicy: OnFailure
  containers:
  - name: cuda-container
    image: docker.io/library/ubuntu:22.04
    command: ["nvidia-smi"]
    imagePullPolicy: IfNotPresent
    resources:
      limits:
        nvidia.com/gpu: 1
EOF
```

Test run:
```bash
kubectl apply -f gpu-test-fast.yaml
sleep 5
kubectl logs gpu-test-fast
```

You should see the full NVIDIA-SMI output, confirming that the GPU path from Kubernetes down to the runtime is functional.