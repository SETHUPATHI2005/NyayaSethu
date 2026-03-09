(function () {
  var KEY = "nyayamithra_api_url";
  var params = new URLSearchParams(window.location.search);
  var fromQuery = params.get("api");

  function clean(url) {
    return String(url || "").trim().replace(/\/+$/, "");
  }

  if (fromQuery) {
    localStorage.setItem(KEY, clean(fromQuery));
  }

  var configured = clean(localStorage.getItem(KEY));
  var isLocal = ["localhost", "127.0.0.1"].indexOf(window.location.hostname) !== -1;
  var fallback = isLocal ? "http://127.0.0.1:8000" : "";

  window.NYAYAMITHRA_API = configured || fallback;
  window.setNyayaMithraApi = function (url) {
    var normalized = clean(url);
    if (!normalized) {
      localStorage.removeItem(KEY);
      window.NYAYAMITHRA_API = fallback;
      return;
    }
    localStorage.setItem(KEY, normalized);
    window.NYAYAMITHRA_API = normalized;
  };
})();

