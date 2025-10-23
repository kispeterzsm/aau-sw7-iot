# Usage

Add in a Huggingface API token as an env variable. You can make one here: https://huggingface.co/settings/tokens

Also you have to accept the usage terms of Gemma here: https://huggingface.co/google/gemma-3-4b-it

Also also this image needs a cuda compatible GPU.

### Example run command

```bash
docker run -p 8080:8080 -e HF_TOKEN=<your_hf_token> <image_name>
```