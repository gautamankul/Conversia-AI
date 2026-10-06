# Multiple site Bots

# Run the Server
Start the API with Uvicorn:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

# How to Use It

1. Ingest/Crawl Each Website
For each new website you want to support, send a request to index it once:

```curl
curl -X POST http://localhost:8000/api/crawl-and-index \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "site_gautam",
    "root_url": "https://gautamankul.pythonanywhere.com/",
    "max_depth": 2
  }'
```
2. Connect Your Frontend Chat Widget
In your frontend widget JavaScript (matching your screenshots), send the user's message along with that website's identifier:

```
async function sendMessage(userMessage) {
  const response = await fetch("https://your-api-domain.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      site_id: "site_gautam", // Change this per site
      message: userMessage
    })
  });

  const data = await response.json();
  console.log(data.reply); // Render inside the chat window
}
```

# How to Embed It on Any Website
Any client website can integrate the bot by pasting this single line before the closing </body> tag:

```html
<script 
  src="https://your-domain.com/chatbot-widget.js" 
  data-api-url="https://your-fastapi-domain.com/api/chat" 
  data-site-id="gautam_site" 
  data-bot-name="Ask AI">
</script>
```

note: To use it on a second website, keep the same script and simply change data-site-id to match the ID indexed for that second domain:

```html
<script 
  src="https://your-domain.com/chatbot-widget.js" 
  data-api-url="https://your-fastapi-domain.com/api/chat" 
  data-site-id="client_two_site" 
  data-bot-name="Support Assistant">
</script>
```

# How to test in swagger

1. opent `http://localhost:8000/swagger` 

2. edit end point for ingest `crawl_and_index_api_crawl_and_index_post`

```
{
  "site_id": "site_gautam",
  "root_url": "https://gautamankul.pythonanywhere.com/",
  "max_depth": 2
}
```

3. 
