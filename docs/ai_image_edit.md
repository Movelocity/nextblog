
```python
async def edit_image_with_gemini(image_base64: str, edit_prompt: str) -> dict:
    """使用Gemini API编辑图片"""
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": edit_prompt},
                    {"inlineData": {"mimeType": "image/png", "data": image_base64}}
                ]
            }
        ],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    # 使用asyncio.to_thread来避免阻塞事件循环
    def make_request():
        response = requests.post(f"{BASE_URL}{ENDPOINT}", json=payload, headers=headers, timeout=600)
        response.raise_for_status()
        return response.json()
    
    return await asyncio.to_thread(make_request)
```

```
POST /api/image-edit
{
  "orig_img": "base64_encoded_image", // any shape, longer edge < 1600px, no format restriction
  "orig_thumb": "base64_encoded_image_thumbnail", // center crop and resize to 180x180, no format restriction
  "prompt": "let the man in the image wear a hat"
}
```

START A TASK

1. generate a unique task id related to format timestamp

2. store orig_img, orig_thumb to blogStorage, save task information and original image links to image-edit.json

3. return status ok and task id

TASK CONTINUE TO RUN

1. call the api, get the result after 90 seconds

2. store result_img, result_thumb to blogStorage and generate short links

3. update task status to file, and user can read the task file through other api



```
generated_images = []
model_description = ""

for part in result["candidates"][0]["content"]["parts"]:
    if "inlineData" in part and part["inlineData"]["data"]:
        # 保存生成的图片
        image_data = base64.b64decode(part["inlineData"]["data"])
        edited_image = Image.open(BytesIO(image_data))
        
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
        edited_filename = f"generated/gemini-edited-{file_id}-{timestamp}.png"
        edited_image.save(edited_filename)
        
        generated_images.append({
            "filename": edited_filename,
            "url": f"/{edited_filename}"
        })
        
    elif "text" in part and part["text"]:
        model_description = part["text"]

```