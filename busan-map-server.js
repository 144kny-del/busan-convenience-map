// Local server for the Busan Convenience Map.
// The Kakao REST API key is held only in this running process.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '127.0.0.1';
const APP_FILE = path.join(__dirname, 'busan-convenience-prototype.html');
let runtimeKey = process.env.KAKAO_REST_API_KEY || '';

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type.includes('json') ? JSON.stringify(body) : body);
}

http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (requestUrl.pathname === '/') {
    return fs.readFile(APP_FILE, (error, data) => {
      if (error) return send(res, 500, '앱 파일을 읽을 수 없습니다.', 'text/plain; charset=utf-8');
      return send(res, 200, data, 'text/html; charset=utf-8');
    });
  }

  if (requestUrl.pathname === '/api/set-key' && req.method === 'POST') {
    let raw = '';
    req.on('data', chunk => {
      if (raw.length < 500) raw += chunk;
    });
    return req.on('end', () => {
      try {
        const key = String(JSON.parse(raw).key || '').trim();
        if (!/^[a-zA-Z0-9]{20,80}$/.test(key)) {
          return send(res, 400, { error: 'REST API 키 형식이 올바르지 않습니다.' });
        }
        runtimeKey = key;
        return send(res, 200, { ok: true });
      } catch {
        return send(res, 400, { error: 'REST API 키를 읽지 못했습니다.' });
      }
    });
  }

  if (requestUrl.pathname !== '/api/place-search') {
    return send(res, 404, { error: '찾을 수 없는 주소입니다.' });
  }
  if (req.method !== 'GET') {
    return send(res, 405, { error: 'GET 요청만 사용할 수 있습니다.' });
  }

  const query = (requestUrl.searchParams.get('query') || '').trim().slice(0, 80);
  const x = Number(requestUrl.searchParams.get('x'));
  const y = Number(requestUrl.searchParams.get('y'));
  const radius = Math.min(Math.max(Number(requestUrl.searchParams.get('radius')) || 3000, 1), 20000);

  if (!runtimeKey) {
    return send(res, 503, { error: '카카오 REST API 키가 아직 서버에 설정되지 않았습니다.' });
  }
  if (!query || !Number.isFinite(x) || !Number.isFinite(y)) {
    return send(res, 400, { error: '검색어나 현재 위치가 올바르지 않습니다.' });
  }

  const apiUrl = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
  apiUrl.searchParams.set('query', query);
  apiUrl.searchParams.set('x', x);
  apiUrl.searchParams.set('y', y);
  apiUrl.searchParams.set('radius', radius);
  apiUrl.searchParams.set('sort', 'distance');
  apiUrl.searchParams.set('size', '15');

  try {
    const response = await fetch(apiUrl, {
      headers: { Authorization: `KakaoAK ${runtimeKey}` }
    });
    const data = await response.json();
    if (!response.ok) {
      return send(res, response.status, { error: data.msg || '카카오 검색 요청에 실패했습니다.' });
    }
    return send(res, 200, data);
  } catch {
    return send(res, 502, { error: '카카오 검색 서버에 연결하지 못했습니다.' });
  }
}).listen(PORT, HOST, () => {
  console.log(`Busan map is running: http://${HOST}:${PORT}`);
});

