root /var/www/nexusmind-web-ui;
index index.html;

location / {
    try_files $uri $uri/ /index.html;
}
