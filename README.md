# aau-sw7-iot
University project 2025 fall semester at AAU. The project is a website capable of tracking the source of information, such as the first webpage where the info appeared.

## Run docker compose

On your terminal build the docker compose with:
```bash
docker compose up 
```

Then set the env with:
```bash
export HF_TOKEN=<your_token>
```

Then finally run with:
```bash
docker compose up # with logs
```

Or:
```bash
docker compose up -d # with no logs
```
