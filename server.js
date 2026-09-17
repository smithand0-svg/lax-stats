/**
 * cPanel's "Setup Node.js App" tool (Phusion Passenger) expects a plain
 * Node.js entry file it can start directly — it doesn't run `next start`
 * itself. This file boots the built Next.js app the way Passenger expects.
 *
 * cPanel sets PORT automatically; we just need to listen on whatever it gives us.
 */
const { createServer } = require('http');
const next = require('next');

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(process.env.PORT || 3000, () => {
    console.log('SJJ Lacrosse Stats app ready on port', process.env.PORT || 3000);
  });
});
