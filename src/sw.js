var CACHE_VERSION = 1;
var CURRENT_CACHES = {
  prefetch: "prefetch-cache-v" + CACHE_VERSION
};

// Here is code to install Service Worker.
self.addEventListener("install", function(event) {
  var now = Date.now();
  var urlsToPrefetch = ["assets/images/avatar.png"];

  console.log("Handling install event. Resouses to prefetch:", urlsToPrefetch);
  event.waitUntil(
    caches.open(CURRENT_CACHES.prefetch).then(function(cache) {
      var cachePromises = urlsToPrefetch.map(function(urlToPrefetch) {
        var url = new URL(urlToPrefetch, location.href);
        url.search += (url.search ? "&" : "?") + "cache-bust=" + now;
        var request = new Request(url, { mode: "no-cors" });
        return fetch(request)
          .then(function(response) {
            if (response >= 400) {
              throw new Error(
                "request for " +
                  urlsToPrefetch +
                  " failed with status " +
                  response.statusText
              );
            }
            console.log("put into cache", response);
            return cache.put(urlToPrefetch, response);
          })
          .catch(function(error) {
            console.error("Not caching " + urlToPrefetch + " due to " + error);
          });
      });
    })
  );
});

self.addEventListener("activate", function(event) {
  var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function(key) {
    return CURRENT_CACHES[key];
  });
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (expectedCacheNames.indexOf(cacheName) === -1) {
            console.log("Deleting out of data cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// `fetch` is an actual function to retrieve resources from Network.
// SW can inject fetch event then return cached resource from SW.
self.addEventListener("fetch", function(event) {
  console.log("Handling fetch event for", event.request.url);

  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        console.log("Found response in cache: ", response);
        return response;
      }

      console.log(
        "No response found in cache. So fetch from network...",
        event.request
      );
      var fetchRequest = event.request.clone();
      return fetch(fetchRequest)
        .then(function(response) {
          console.log("Response from network is:" + response);
          return response;
        })
        .catch(function(error) {
          console.error("Failed fetching:", error);
          throw error;
        });
    })
  );
});
