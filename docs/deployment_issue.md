
# Content Too Large

Assets支持上传任意文件，并且没有大小限制，但如果通过 nginx 来转发，可能会遇到接口异常

`413 Content Too Large`

这种情况下，是 nginx 转发时限制的数据包的尺寸。

有两种解决方式：
1. 分块上传，这个功能待开发
2. 提高nginx的传输上限
    ```nginx
    server {
        location / {  # 对特定站点或路径限制文件大小
            client_max_body_size 50M;  # 自定义单次传输文件大小限制
        }
    }
    ```

    ```bash
    sudo nginx -t  # 检查配置是否正确
    sudo nginx -s reload # 重新加载 nginx
    ```