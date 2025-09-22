const CACHE_NAME = 'gemma-ai-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/robots.txt'
];

// 安装事件
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// 激活事件
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated successfully');
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳过 chrome-extension 和其他非 http(s) 请求
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // 对于模型文件，使用缓存优先策略
  if (event.request.url.includes('.task') || event.request.url.includes('.bin')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('Serving model from cache:', event.request.url);
            return response;
          }
          
          console.log('Fetching and caching model:', event.request.url);
          return fetch(event.request)
            .then(response => {
              // 检查响应是否有效
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // 克隆响应用于缓存
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            });
        })
        .catch(error => {
          console.error('Error serving model file:', error);
          throw error;
        })
    );
    return;
  }

  // 对于其他资源，使用网络优先策略
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 检查响应是否有效
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 对于静态资源，缓存响应
        if (STATIC_CACHE_URLS.includes(new URL(event.request.url).pathname)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }

        return response;
      })
      .catch(() => {
        // 网络失败时，尝试从缓存获取
        return caches.match(event.request)
          .then(response => {
            if (response) {
              console.log('Serving from cache (offline):', event.request.url);
              return response;
            }
            
            // 如果是页面请求且缓存中没有，返回离线页面
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
            
            throw new Error('Resource not available offline');
          });
      })
  );
});

// 处理消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 错误处理
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
});
