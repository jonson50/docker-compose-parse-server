// Express application adding the parse-server module to expose Parse
// compatible API routes.
'use strict';
import express from 'express';
import { ParseServer, ParseGraphQLServer } from 'parse-server';
import path from 'path';
const __dirname = path.resolve();
import http from 'http';

/*** Getting current gataway ip from the container */
import { networkInterfaces } from 'os';
const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
    if (net.family === familyV4Value && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}
const currentIP = results["eth0"][0].split('.');
currentIP[currentIP.length - 1] = '1';
const gateway = currentIP.join('.');
/*** End of getting current gataway ip from the container */

export const config = {
  databaseURI:
  process.env.PARSE_SERVER_DATABASE_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.PARSE_SERVER_APPLICATION_ID || 'myAppId',
  masterKey: process.env.PARSE_SERVER_MASTER_KEY || '', //Add your master key here. Keep it secret!
  masterKeyIps: process.env.PARSE_SERVER_MASTER_KEY_IPS || [ gateway ],
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse', // Don't forget to change to https if needed
  liveQuery: {
    classNames: ['Posts', 'Comments'], // List of classes to support for query subscriptions
  },
  restAPIKey: process.env.PARSE_SERVER_REST_API_KEY || '',
  clientKey: process.env.PARSE_SERVER_CLIENT_KEY || '',
  mountGraphQL: process.env.PARSE_SERVER_MOUNT_GRAPHQL || false,
  //mountPlayground: process.env.PARSE_SERVER_MOUNT_PLAYGROUND || false,
};
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

export const app = express();
app.set('trust proxy', true);
// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));
// Serve the Parse API on the /parse URL prefix
if (!process.env.TESTING) {
  const mountPath = process.env.PARSE_SERVER_MOUNT_PATH || '/parse';
  const server = new ParseServer(config);
  const parseGraphQLServer = new ParseGraphQLServer(
    server,
    {
      graphQLPath: '/graphql',
      playgroundPath: '/playground'
    }
  );

  parseGraphQLServer.applyGraphQL(app); // Mounts the GraphQL API
  await server.start();
  app.use(mountPath, server.app);
}

// Parse Server plays nicely with the rest of your web routes
app.get('/', function (req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

if (!process.env.TESTING) {
  const port = process.env.PORT || 1337;
  const httpServer = http.createServer(app);
  httpServer.listen(port, function () {
    console.log('parse-server-example running on port ' + port + '.');
  });
  // This will enable the Live Query real-time server
  await ParseServer.createLiveQueryServer(httpServer);
}
