export default function handler(req, res) {
  res.status(200).setHeader('content-type', 'text/plain').send('ok\n')
}
