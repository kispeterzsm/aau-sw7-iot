# Usage

Add in a Huggingface API token as an env variable. You can make one here: https://huggingface.co/settings/tokens

Also you have to accept the usage terms of Gemma here: https://huggingface.co/google/gemma-3-4b-it

Also also this image needs a cuda compatible GPU.

### Example run command

```bash
docker run -p 8080:8080 -e HF_TOKEN=<your_hf_token> <image_name>
```

### Example process

- `input` is the URL from the user
- `search_depth` is the maximum amount of result links that you want back. The higher this is the longer it will take

```bash
curl -X POST http://localhost:8080/link -H "Content-Type: application/json" -d '{"input": "https://example.com", "search_depth": 25}'
```

### For the server commands

Run them on either bash or zsh do not use sh.