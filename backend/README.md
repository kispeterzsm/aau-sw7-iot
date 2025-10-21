# Backend

The backend is a simple flask app that serves the website, we will add more features to it later.

## Kubernetes

### Installing

Read the [README](https://github.com/kispeterzsm/aau-sw7-iot/tree/backend/backend/blob/master/INSTALL.md) for more information.

### To build Docker images to run in containerd

Read the [README](https://github.com/kispeterzsm/aau-sw7-iot/tree/backend/backend/blob/master/DOCKER_IMAGE_BUILD.md) for more information.

### Running

To run the backend, you need to have a kubernetes cluster running.
After that you need to add the configuration file for each pod:

```bash
kubectl apply -f <pod-name>
```

To check inside a pod, you can use the following command:

```bash
kubectl port-forward <pod-name> <port>:<port>
``` 