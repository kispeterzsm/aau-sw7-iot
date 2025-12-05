# Sending mail

1. Set up an HTML template under `templates`. For example a `welcome.html`:
```html
<html>
  <body style="font-family: Arial;">
    <h2>Welcome, {{username}}!</h2>
    <p>Thank you for joining IOT. Happy searching! :D</p>
  </body>
</html>
```

2. Send a request to the email service like:
```bash
curl -X POST http://localhost:9000/send
    -H "Content-Type: application/json"
    -d '{
          "to": "joe@mama.com",
          "template": "welcome",
          "subject":"Welcome to IOT!",
          "variables": { "username": "Alice" }
        }'
```

3. Go to [localhost:1080](localhost:1080) and see if it arrived.