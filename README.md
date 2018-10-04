# LINIUS SHAKA INTEGRATION DEMO

It uses a **protobufjs** & **video.js** libraries
and modified **shaka-player** lib to play **Linius Engine** files.
- https://www.npmjs.com/package/protobufjs
- https://www.npmjs.com/package/video.js

Check source -> *js/index.js* to get insight how to integrate your own UI with shaka player.
To check the demo you can do the following:
- `nginx -p . -c ./nginx/nginx.conf`
- Go to http://localhost:8080

Caveats:
- ES6 syntax features is used in example
- Chrome fits better than other browsers to check the example
- This example doesn't work in IE (any versions of it)
