If you try to connect an hubiquitus client to an endpoints like "http://localhost:8080" and you network lock this type of connection you couldn't establish a connection. Then you can use a proxy pass

## Example for a nginx server :

* Edit the file `/etc/nginx/sites-enabled/default` and add the following lines :
```
    location /hubi1/ {
                proxy_redirect http://localhost:8080/ http://serverHost/hubi1/;
                proxy_pass http://localhost:8080/;
        }
```

* Restart your nginx server :
```
    sudo /etc/init.d/nginx restart
```

## How hubiquitus4js manage this

* You just have to fill the endpoints attribute with the proxy pass endpoints (`http://serverHost/hubi1`).
* Hubiquitus4js will automatically add `/socket.io` to the endpoints
* You will be connect to the hServer throughcd `http://serverHost/hub1/socket.io`